import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    FuturesClient,
    FuturesHoldSide,
    FuturesOrderSide,
    FuturesSymbolRule,
    ModifyFuturesPlanStopOrder,
    NewFuturesOrder,
    NewFuturesPlanStopOrder,
} from 'bitget-api'
import { BitgetUtilsService } from '../bitget-utils/bitget-utils.service'
import { InjectModel } from '@nestjs/mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { Model, Types } from 'mongoose'
import { TakeProfit } from 'src/model/TakeProfit'
import { StopLoss } from 'src/model/StopLoss'
import { OrderService } from 'src/modules/order/order.service'
import { User } from 'src/model/User'

@Injectable()
export class BitgetActionService {
    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(TakeProfit.name)
        private takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>,
    ) {}

    async setLeverage(
        client: FuturesClient,
        user: User,
        symbol: string,
        price: number,
    ): Promise<number> {
        const position = await client.getPosition(
            symbol,
            user.preferences.order.marginCoin,
        )
        if (position?.data?.length > 0) return Number(position.data[0].leverage)
        if (!price) {
            price = await this.bitgetUtilsService.getCurrentPrice(
                client,
                symbol,
            )
        }
        let leverage = this.bitgetUtilsService.getLeverage(user, price)
        await Promise.all([
            client
                .setLeverage(
                    symbol,
                    user.preferences.order.marginCoin,
                    String(leverage),
                    'long',
                )
                .catch((e) => console.error('setLeverage', e)),
            client
                .setLeverage(
                    symbol,
                    user.preferences.order.marginCoin,
                    String(leverage),
                    'short',
                )
                .catch((e) => console.error('setLeverage', e)),
        ])
        return Number(leverage)
    }

    async setMarginMode(client: FuturesClient, user: User, symbol: string) {
        await client
            .setMarginMode(symbol, user.preferences.order.marginCoin, 'fixed')
            .catch((e) => console.error('setMarginMode', e))
    }

    async placeOrder(
        client: FuturesClient,
        user: User,
        symbolRules: FuturesSymbolRule,
        usdt: number,
        side: FuturesOrderSide,
        pe: number,
        tps: number[],
        stopLoss: number,
        leverage: number,
        currentPrice: number,
        linkOrderId?: Types.ObjectId,
        marginCoin = 'USDT',
    ) {
        await this.setMarginMode(client, user, symbolRules.symbol)
        try {
            const quantity = this.bitgetUtilsService.getQuantityForUSDT(
                usdt,
                pe,
                leverage,
            )
            const size = this.bitgetUtilsService.fixSizeByRules(
                quantity,
                symbolRules,
            )
            // @ts-ignore
            if (size <= 0 || usdt < (symbolRules.minTradeUSDT || 1000000)) {
                throw new Error(
                    // @ts-ignore
                    `La quantité ${usdt} est trop petite pour un ordre, le minimum est ${symbolRules.minTradeUSDT}`,
                )
            }
            const TPsCalculate = this.bitgetUtilsService.caculateTPsToUse(
                tps,
                size,
                user.preferences.order.TPSize,
                symbolRules,
            )
            // @ts-ignore
            if (TPsCalculate.length === 0 || usdt < symbolRules.minTradeUSDT)
                throw new Error(
                    `La quantité ${usdt} est trop petite pour un ordre`,
                )
            const clOrderId = new Types.ObjectId()

            const newOrder = new this.orderModel({
                clOrderId,
                PE: pe,
                TPs: TPsCalculate.sort(),
                SL: stopLoss,
                symbol: symbolRules.symbol,
                side: side.split('_')[1] as FuturesHoldSide,
                linkOrderId,
                quantity: size,
                marginCoin,
                usdt,
                userId: user._id,
            })

            this.orderService.checkNewOrder(newOrder)

            newOrder.sendToPlateform = this.bitgetUtilsService.canSendBitget(
                symbolRules,
                currentPrice,
                newOrder,
            );

            if (newOrder.sendToPlateform) {
                return await this.placeOrderBitget(client, newOrder)
            }

            return await newOrder.save()
        } catch (e) {
            console.error('placeOrder', e)
            throw e
        }
    }

    async placeOrderBitget(client: FuturesClient, order: Order) {
        const newOrderParams: NewFuturesOrder = {
            marginCoin: order.marginCoin,
            orderType: 'limit',
            price: String(order.PE),
            side: ('open_' + order.side) as FuturesOrderSide,
            size: String(order.quantity),
            symbol: order.symbol,
            clientOid: order.clOrderId.toString(),
        }
        const result = await client.submitOrder(newOrderParams)
        const { orderId } = result.data
        order.orderId = orderId;
        order.sendToPlateform = true;
        return await this.orderModel.findOneAndUpdate(
            { _id: order._id },
            order,
            { new: true, upsert: true },
        )
    }

    async activeOrder(client: FuturesClient, user: User, orderId: Types.ObjectId) {
        try {
            const order = await this.orderModel.findById(orderId);
            if (!order) return null
            const symbolRules = await this.bitgetUtilsService.getSymbolBy(
                client,
                'symbol',
                order.symbol,
            )
            if (!symbolRules) throw new Error('Symbol not found')
            await this.activeSL(client, symbolRules, order)
            await this.activeTPs(client, user, symbolRules, order)
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
        user: User,
        symbolRules: FuturesSymbolRule,
        order: Order,
    ) {
        const TPconfig = user.preferences.order.TPSize[order.TPs.length]
        let additionnalSize = 0
        // Take profits
        for (let i = 0; i < order.TPs.length; i++) {
            const num = i + 1
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
                    num,
                    symbol: symbolRules.symbol,
                    side: order.side,
                    marginCoin: order.marginCoin,
                    userId: order.userId,
                }).save()
            } catch (e) {
                additionnalSize -= size
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
            const result = await client.modifyStopOrder(params)
            stopLoss.orderId = result.data.orderId
            stopLoss.price = stepsTriggers[newStep]
            stopLoss.historyTrigger = [
                ...stopLoss.historyTrigger,
                stopLoss.triggerPrice,
            ]
            stopLoss.triggerPrice = stepsTriggers[newStep]
            stopLoss.step = newStep
            await stopLoss.save()
            return stopLoss.toObject() as StopLoss
        } catch (e) {
            console.error('upgradeSL', e)
            throw e
        }
    }

    async cancelOrder(
        client: FuturesClient,
        userId: Types.ObjectId,
        order: Order,
    ) {
        try {
            await client.cancelOrder(
                order.symbol,
                order.marginCoin,
                order.orderId,
            )
            await this.orderService.cancelOrder(order._id, userId)
        } catch (e) {
            console.error('cancelOrder', e)
        }
    }

    async disabledOrderLink(
        client: FuturesClient,
        linkId: Types.ObjectId,
        userId: Types.ObjectId,
    ) {
        const orders = await this.orderModel.find({
            linkOrderId: linkId,
            terminated: false,
            activated: false,
            userId,
        })
        for (const order of orders) {
            await client.cancelOrder(
                order.symbol,
                order.marginCoin,
                order.orderId,
            )
        }
        await this.orderService.disabledOrderLink(linkId, userId)
    }
}
