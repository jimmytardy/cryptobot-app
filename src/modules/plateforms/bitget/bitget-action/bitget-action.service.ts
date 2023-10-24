import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    FuturesClient,
    FuturesHoldSide,
    FuturesOrderSide,
    FuturesSymbolRule,
    ModifyFuturesPlanStopOrder,
    NewFuturesOrder,
    NewFuturesPlanPositionTPSL,
    NewFuturesPlanStopOrder,
} from 'bitget-api'
import { BitgetUtilsService } from '../bitget-utils/bitget-utils.service'
import { InjectModel } from '@nestjs/mongoose'
import { Order } from 'src/model/Order'
import { Model, Types } from 'mongoose'
import { TakeProfit } from 'src/model/TakeProfit'
import { StopLoss } from 'src/model/StopLoss'
import { OrderService } from 'src/modules/order/order.service'

@Injectable()
export class BitgetActionService {
    TPSize: { [x: string]: number[] } = {
        1: [1],
        2: [0.5, 0.5],
        3: [0.25, 0.5, 0.25],
        4: [0.2, 0.3, 0.3, 0.2],
        5: [0.15, 0.2, 0.3, 0.2, 0.15],
        6: [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
    }
    marginCoin = 'USDT'
    // [prix max d'une crypto, levier]
    leviersSettings: { minPrice: number; value: string }[] = [
        {
            minPrice: 0,
            value: '10',
        }, // 0-1€, levier 10
        {
            minPrice: 1,
            value: '15',
        }, // 1-10€, levier 15
        {
            minPrice: 10,
            value: '20',
        }, // 10-50€, levier 20
        {
            minPrice: 50,
            value: '20',
        }, // 50-100, levier 20
        {
            minPrice: 250,
            value: '25',
        }, // 250-1000, levier 25
        {
            minPrice: 1000,
            value: '30',
        }, // 1000+, levier 30
    ]

    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(TakeProfit.name)
        private takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>,
    ) {}

    getLeverage(price: number): string {
        let levierSelect = this.leviersSettings[0]
        for (const levierSetting of this.leviersSettings) {
            if (
                levierSelect.minPrice < levierSetting.minPrice &&
                levierSetting.minPrice < price
            ) {
                levierSelect = levierSetting
            }
        }
        return levierSelect.value
    }

    async setLeverage(client: FuturesClient, symbol: string, price: number) {
        if (!price) {
            price = await this.bitgetUtilsService.getCurrentPrice(
                client,
                symbol,
            )
        }
        let leverage = this.getLeverage(price)
        await Promise.all([
            client.setLeverage(symbol, this.marginCoin, leverage, 'long'),
            client.setLeverage(symbol, this.marginCoin, leverage, 'short'),
        ])
    }

    async setMarginMode(client: FuturesClient, symbol: string) {
        await client.setMarginMode(symbol, this.marginCoin, 'fixed')
    }

    async placeOrder(
        client: FuturesClient,
        userId: Types.ObjectId,
        symbolRules: FuturesSymbolRule,
        usdt: number,
        side: FuturesOrderSide,
        pe: number,
        tps: number[],
        stopLoss: number,
        linkOrderId?: Types.ObjectId,
        marginCoin = 'USDT',
    ) {
        try {
            const quantity = this.bitgetUtilsService.getQuantityForUSDT(
                usdt,
                pe,
                parseInt(this.getLeverage(pe)),
            )
            const size = this.bitgetUtilsService.fixSizeByRules(
                quantity,
                symbolRules,
            )
            if (size <= 0) return
            await Promise.all([
                this.setLeverage(client, symbolRules.symbol, pe),
                this.setMarginMode(client, symbolRules.symbol),
            ]);

            const clOrderId = new Types.ObjectId()
            const newOrder: NewFuturesOrder = {
                marginCoin,
                orderType: 'limit',
                price: String(pe),
                side: side,
                size: String(size),
                symbol: symbolRules.symbol,
                clientOid: clOrderId.toString(),
            }
            const result = await client.submitOrder(newOrder)

            const { orderId } = result.data

            return await new this.orderModel({
                clOrderId,
                PE: pe,
                TPs: tps.sort(),
                SL: stopLoss,
                orderId,
                symbol: symbolRules.symbol,
                side: side.split('_')[1] as FuturesHoldSide,
                linkOrderId,
                quantity: size,
                marginCoin,
                userId,
            }).save()
        } catch (e) {
            console.error('placeOrder', e)
            throw e
        }
    }

    async activeOrder(client: FuturesClient, orderId: string) {
        try {
            const order = await this.orderModel.findOne({ orderId })
            if (!order) return null
            const symbolRules = await this.bitgetUtilsService.getSymbolBy(
                client,
                'symbol',
                order.symbol,
            )
            if (!symbolRules) throw new Error('Symbol not found')
            await this.activeSL(client, symbolRules, order)
            await this.activeTPs(client, symbolRules, order)
            order.activated = true
            await order.save()
        } catch (e) {
            console.error('error activeOrder', e)
            throw e
        }
    }

    private async activeSL(
        client: FuturesClient,
        symbolRules: FuturesSymbolRule,
        order: Order,
    ) {
        try {
            const clientOid = new Types.ObjectId()
            const params: NewFuturesPlanStopOrder = {
                symbol: symbolRules.symbol,
                size: order.quantity.toString(),
                marginCoin: order.marginCoin,
                planType: 'loss_plan',
                triggerType: 'fill_price',
                triggerPrice: String(order.SL),
                holdSide: order.side,
                clientOid: clientOid.toString(),
            }
            const result = await client.submitStopOrder(params)
            const { orderId } = result.data
            await new this.stopLossModel({
                clOrderId: clientOid,
                price: order.SL,
                orderId,
                orderParentId: order._id,
                triggerPrice: order.SL,
                terminated: false,
                symbol: symbolRules.symbol,
                side: order.side,
                userId: order.userId,
            }).save()
        } catch (e) {
            console.error('activeSL', e)
        }
    }

    private async activeTPs(
        client: FuturesClient,
        symbolRules: FuturesSymbolRule,
        order: Order,
    ) {
        const TPconfig = this.TPSize[order.TPs.length];
        let additionnalSize = 0
        // Take profits
        for (let i = 0; i < order.TPs.length; i++) {
            const isLast = i === order.TPs.length - 1
            const TP = order.TPs[i]
            let size = 0
            if (isLast) {
                size = this.bitgetUtilsService.fixSizeByRules(
                    order.quantity - additionnalSize,
                    symbolRules,
                )
            } else {
                size = this.bitgetUtilsService.fixSizeByRules(
                    TPconfig[i] * order.quantity,
                    symbolRules,
                )
                additionnalSize += size
            }
            try {
                const clOrderId = new Types.ObjectId()
                const params: NewFuturesPlanStopOrder = {
                    symbol: symbolRules.symbol,
                    marginCoin: order.marginCoin,
                    planType: 'profit_plan',
                    triggerPrice: String(TP),
                    size: size.toString(),
                    triggerType: 'fill_price',
                    holdSide: order.side,
                    clientOid: clOrderId.toString(),
                }
                const result = await client.submitStopOrder(params)

                const { orderId } = result.data

                await new this.takeProfitModel({
                    triggerPrice: TP,
                    clOrderId,
                    orderId,
                    orderParentId: order._id,
                    quantity: size,
                    terminated: false,
                    num: i + 1,
                    symbol: symbolRules.symbol,
                    side: order.side,
                    marginCoin: order.marginCoin,
                    userId: order.userId,
                }).save()
            } catch (e) {
                additionnalSize -= size;
                console.error(
                    'activeTPs',
                    i,
                    {
                        symbol: symbolRules.symbol,
                        marginCoin: order.marginCoin,
                        planType: 'profit_plan',
                        size: size.toString(),
                        triggerType: 'fill_price',
                        triggerPrice: String(TP),
                        holdSide: order.side,
                    },
                    e,
                )
            }
        }
    }

    async upgradeSL(client: FuturesClient, order: Order): Promise<StopLoss> {
        try {
            const stopLoss = await this.stopLossModel.findOne({
                orderParentId: order._id,
                terminated: { $ne: true },
            })

            if (!stopLoss) {
                return
            }

            let newStep = stopLoss.step + 1

            let stepsTriggers: number[] = [order.PE]
            const orderLinked = await this.orderModel.findOne(
                { linkOrderId: order.linkOrderId, _id: { $ne: order._id } },
                'PE',
            )
            if (orderLinked) {
                stepsTriggers.push(orderLinked.PE)
            } else {
                stepsTriggers.push(order.PE)
            }
            // Array of PE + TPs for triggerPrice
            stepsTriggers = stepsTriggers.concat(order.TPs).sort()
            const params: ModifyFuturesPlanStopOrder = {
                marginCoin: order.marginCoin,
                orderId: stopLoss.orderId,
                planType: 'loss_plan',
                symbol: order.symbol,
                triggerPrice: stepsTriggers[newStep].toString(),
            }
            console.log('stepsTriggers', stepsTriggers);
            console.log('stepsTriggers[newStep]', stepsTriggers[newStep])
            const result = await client.modifyStopOrder(params)
            stopLoss.orderId = result.data.orderId
            stopLoss.price = stepsTriggers[newStep];
            stopLoss.historyTrigger = [...stopLoss.historyTrigger, stopLoss.triggerPrice]
            stopLoss.triggerPrice = stepsTriggers[newStep];
            stopLoss.step = newStep;
            await stopLoss.save()
            return stopLoss.toObject() as StopLoss
        } catch (e) {
            console.error('upgradeSL', e)
            throw e
        }
    }

    async cancelOrder(client: FuturesClient, order: Order) {
        try {
            await client.cancelOrder(
                order.symbol,
                order.marginCoin,
                order.orderId,
            )
            await this.orderService.cancelOrder(order._id)
        } catch (e) {
            console.error('removeOrder', e)
        }
    }

    async disabledOrderLink(client: FuturesClient, linkId: Types.ObjectId) {
        const orders = await this.orderModel.find({
            linkOrderId: linkId,
            terminated: false,
            activated: false,
        })
        for (const order of orders) {
            await client.cancelOrder(
                order.symbol,
                order.marginCoin,
                order.orderId,
            )
        }
        await this.orderService.disabledOrderLink(linkId)
    }
}
