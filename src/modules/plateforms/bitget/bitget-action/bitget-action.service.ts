import { Injectable } from '@nestjs/common'
import {
    CancelFuturesPlanTPSL,
    FuturesClient,
    FuturesHoldSide,
    FuturesOrderSide,
    FuturesSymbolRule,
    ModifyFuturesOrder,
    ModifyFuturesPlanStopOrder,
    NewFuturesOrder,
    NewFuturesPlanStopOrder,
    RestClientV2,
} from 'bitget-api'
import { BitgetUtilsService } from '../bitget-utils/bitget-utils.service'
import { InjectModel } from '@nestjs/mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { Model, Types } from 'mongoose'
import { TakeProfit, TakeProfitDocument } from 'src/model/TakeProfit'
import { StopLoss } from 'src/model/StopLoss'
import { OrderService } from 'src/modules/order/order.service'
import { User } from 'src/model/User'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'

@Injectable()
export class BitgetActionService {
    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(TakeProfit.name)
        private takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>,
    ) {}

    async setLeverage(client: FuturesClient, user: User, symbol: string, price?: number): Promise<number> {
        const position = await client.getPosition(symbol, user.preferences.order.marginCoin)
        // if (position?.data?.length > 0) return Number(position.data[0].leverage)
        if (!price) {
            price = await this.bitgetUtilsService.getCurrentPrice(client, symbol)
        }
        let leverage = this.bitgetUtilsService.getLeverage(user, price)
        await Promise.all([
            client.setLeverage(symbol, user.preferences.order.marginCoin, String(leverage), 'long').catch((e) => console.error('setLeverage', e)),
            client.setLeverage(symbol, user.preferences.order.marginCoin, String(leverage), 'short').catch((e) => console.error('setLeverage', e)),
        ])
        return Number(leverage)
    }

    async setMarginMode(client: FuturesClient, user: User, symbol: string) {
        await client.setMarginMode(symbol, user.preferences.order.marginCoin, 'fixed').catch((e) => console.error('setMarginMode', e))
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
            const quantity = this.bitgetUtilsService.getQuantityForUSDT(usdt, pe, leverage)
            const size = this.bitgetUtilsService.fixSizeByRules(quantity, symbolRules)
            // @ts-ignore
            if (size <= 0 || usdt < (symbolRules.minTradeUSDT || 1000000)) {
                throw new Error(
                    // @ts-ignore
                    `La quantité ${usdt} est trop petite pour un ordre, le minimum est ${symbolRules.minTradeUSDT}`,
                )
            }
            const sideOrder = side.split('_')[1] as FuturesHoldSide
            let TPsCalculate = this.bitgetUtilsService.caculateTPsToUse(tps, size, user.preferences.order.TPSize, symbolRules, sideOrder).TPPrice
            // @ts-ignore
            if (TPsCalculate.length === 0 || usdt < symbolRules.minTradeUSDT) throw new Error(`La quantité ${usdt} est trop petite pour un ordre`)
            const clOrderId = new Types.ObjectId()
            let newOrder = new this.orderModel({
                clOrderId,
                PE: pe,
                TPs: sideOrder === 'long' ? TPsCalculate : TPsCalculate.reverse(),
                SL: stopLoss,
                symbol: symbolRules.symbol,
                side: sideOrder,
                linkOrderId,
                quantity: size,
                marginCoin,
                usdt,
                userId: user._id,
            })

            this.orderService.checkNewOrder(newOrder)

            newOrder.sendToPlateform = this.bitgetUtilsService.canSendBitget(symbolRules, currentPrice, newOrder)
            const PEOriginPrice = newOrder.PE
            if (newOrder.sendToPlateform) {
                return await this.placeOrderBitget(client, newOrder)
            } else if ((sideOrder === 'long' && pe < currentPrice) || (sideOrder === 'short' && pe > currentPrice)) {
                try {
                    newOrder.PE = currentPrice
                    if (sideOrder === 'long') {
                        newOrder.PE *= 1 - Number(symbolRules.buyLimitPriceRatio)
                    } else {
                        newOrder.PE *= 1 + Number(symbolRules.sellLimitPriceRatio)
                    }
                    newOrder.PE = parseFloat(String(newOrder.PE.toFixed((symbolRules.sizeMultiplier.split('.')[1] || '').length)))
                    newOrder = await this.placeOrderBitget(client, newOrder)
                    newOrder.sendToPlateform = true
                    await this.updateOrderPE(client, newOrder, PEOriginPrice)
                } catch (e) {
                    console.error('placeOrder > manual place order', e)
                    throw e
                } finally {
                    newOrder.PE = PEOriginPrice
                }
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
        const result = await client.submitOrder(newOrderParams).catch((e) => {
            console.error('placeOrderBitget', e)
            throw e
        })
        const { orderId } = result.data
        order.orderId = orderId
        order.sendToPlateform = true
        return await this.orderModel.findOneAndUpdate({ _id: order._id }, order, { new: true, upsert: true })
    }

    async activeOrder(client: FuturesClient, user: User, orderId: Types.ObjectId) {
        try {
            const order = await this.orderModel.findById(orderId)
            if (!order) return null
            const symbolRules = await this.bitgetUtilsService.getSymbolBy(client, 'symbol', order.symbol)
            if (!symbolRules) throw new Error('Symbol not found')
            order.activated = true
            await this.activeSL(client, symbolRules, order)
            await this.activeTPs(client, user, symbolRules, order)
            await order.save()
        } catch (e) {
            console.error('error activeOrder', e)
            throw e
        }
    }

    private async activeSL(client: FuturesClient, symbolRules: FuturesSymbolRule, order: Order) {
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

    async replaceTPOfOrderActivate(client: FuturesClient, order: Order, takeProfit: TakeProfitDocument, num: number, newTP: number, newSize: number) {
        if (!order.sendToPlateform || !order.activated) return
        try {
            if (!takeProfit) return
            await this.cancelTPOfOrderActivate(client, order, takeProfit)
            await this.addTPOfOrderActivate(client, order, newTP, num, newSize)
        } catch (e) {
            console.error('replaceTPOfOrderActivate', e)
        }
    }

    async cancelTPOfOrderActivate(client: FuturesClient, order: Order, takeProfit: TakeProfitDocument) {
        if (!order.sendToPlateform || !order.activated) return
        try {
            if (!takeProfit) return
            const params: CancelFuturesPlanTPSL = {
                marginCoin: order.marginCoin,
                planType: 'profit_plan',
                symbol: order.symbol,
                clientOid: takeProfit.clOrderId.toString(),
                orderId: takeProfit.orderId,
            }
            await client.cancelPlanOrderTPSL(params)
            await this.takeProfitModel.deleteOne({ _id: takeProfit._id })
        } catch (e) {
            console.error('cancelTPOfOrderActivate', e)
        }
    }

    async addTPOfOrderActivate(client: FuturesClient, order: Order, newTP: number, num: number, size: number) {
        if (!order.sendToPlateform || !order.activated) return
        const clOrderId = new Types.ObjectId()
        const params: NewFuturesPlanStopOrder = {
            symbol: order.symbol,
            marginCoin: order.marginCoin,
            planType: 'profit_plan',
            triggerPrice: String(newTP),
            size: size.toString(),
            triggerType: 'fill_price',
            holdSide: order.side,
            clientOid: clOrderId.toString(),
        }
        try {
            const result = await client.submitStopOrder(params)
            const { orderId } = result.data
            await new this.takeProfitModel({
                triggerPrice: newTP,
                clOrderId,
                orderId,
                orderParentId: order._id,
                quantity: size,
                terminated: false,
                num: num,
                symbol: order.symbol,
                side: order.side,
                marginCoin: order.marginCoin,
                userId: order.userId,
            }).save()
        } catch (e) {
            console.error('addTPOfOrderActivate', e, num, params)
        }
    }

    private async activeTPs(client: FuturesClient, user: User, symbolRules: FuturesSymbolRule, order: Order) {
        const TPSize = this.bitgetUtilsService.caculateTPsToUse(order.TPs, order.quantity, user.preferences.order.TPSize, symbolRules, order.side).TPSize
        await Promise.all(
            order.TPs.map(async (TP, i) => {
                const size = TPSize[i]
                try {
                    await this.addTPOfOrderActivate(client, order, TP, i + 1, size)
                } catch (e) {
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
            }),
        )
    }

    async upgradeSL(client: FuturesClient, order: Order, strategy: IOrderStrategy, numTP: number): Promise<StopLoss> {
        const stopLoss = await this.stopLossModel.findOne({
            orderParentId: order._id,
            terminated: { $ne: true },
        })
        try {
            if (!stopLoss) {
                return
            }

            let newStep = strategy ? strategy[numTP] : stopLoss.step + 1
            let triggerPrice: number

            if (newStep === -1) {
                triggerPrice = order.SL
            } else {
                let stepsTriggers: number[] = [order.PE]
                const orderLinked = await this.orderModel.findOne(
                    {
                        linkOrderId: order.linkOrderId,
                        _id: { $ne: order._id },
                        userId: order.userId,
                    },
                    'PE',
                )
                if (orderLinked) {
                    stepsTriggers.push(orderLinked.PE)
                } else {
                    stepsTriggers.push(order.PE)
                }
                // Array of PE + TPs for triggerPrice
                stepsTriggers = stepsTriggers.concat(order.TPs).sort()
                if (order.side !== 'long') stepsTriggers = stepsTriggers.reverse()
                triggerPrice = stepsTriggers[newStep]
            }

            if (triggerPrice !== stopLoss.triggerPrice) {
                const params: ModifyFuturesPlanStopOrder = {
                    marginCoin: order.marginCoin,
                    orderId: stopLoss.orderId,
                    planType: 'loss_plan',
                    symbol: order.symbol,
                    triggerPrice: triggerPrice.toString(),
                }
                const result = await client.modifyStopOrder(params)
                stopLoss.orderId = result.data.orderId
                stopLoss.price = triggerPrice
                stopLoss.historyTrigger = [...stopLoss.historyTrigger, stopLoss.triggerPrice]
                stopLoss.triggerPrice = triggerPrice
            }

            stopLoss.step = newStep
            await stopLoss.save()
            return stopLoss.toObject() as StopLoss
        } catch (e) {
            console.error('upgradeSL', e, order, strategy, numTP, stopLoss)
            throw e
        }
    }

    async cancelOrder(client: FuturesClient, userId: Types.ObjectId, order: Order) {
        try {
            if (order.sendToPlateform && order.orderId && !order.terminated) {
                if (!order.activated) {
                    await client.cancelOrder(order.symbol, order.marginCoin, undefined, order.clOrderId?.toString())
                }
            }
            await this.orderService.cancelOrder(order._id, userId)
        } catch (e) {
            console.error('cancelOrder', e)
        }
    }

    async closePosition(client: RestClientV2, userId: Types.ObjectId, symbol: string) {
        try {
            const symbolV2 = this.bitgetUtilsService.convertSymbolToV2(symbol)
            console.log('symbol', symbolV2)
            await client.futuresFlashClosePositions({
                symbol: symbolV2,
                productType: 'USDT-FUTURES',
            })
            await this.orderModel.updateMany(
                {
                    terminated: false,
                    activated: true,
                    symbol,
                    userId
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            );

            await this.takeProfitModel.updateMany(
                {
                    terminated: false,
                    symbol,
                    userId
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            );
            await this.stopLossModel.updateMany(
                {
                    terminated: false,
                    symbol,
                    userId
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            );
        } catch (e) {
            console.error('closePosition', e)
        }
    }

    async disabledOrderLink(client: FuturesClient, linkId: Types.ObjectId, userId: Types.ObjectId) {
        const orders = await this.orderModel.find({
            linkOrderId: linkId,
            terminated: false,
            activated: false,
            userId,
        })
        await Promise.all(
            orders.map(async (order) => {
                await this.cancelOrder(client, userId, order)
            }),
        )
        await this.orderService.disabledOrderLink(linkId, userId)
    }

    async updateOrderPE(client: FuturesClient, order: OrderDocument, newPE: number): Promise<boolean> {
        try {
            if (order.sendToPlateform) {
                if (!order.activated && (order.orderId || order.clOrderId)) {
                    const newClientOid = new Types.ObjectId()
                    const params: ModifyFuturesOrder = {
                        symbol: order.symbol,
                        // orderId: order.orderId,
                        clientOid: order.clOrderId?.toString(),
                        newClientOid: newClientOid.toString(),
                        price: String(newPE),
                        size: order.quantity.toString(),
                    }
                    await client.modifyOrder(params)
                    order.clOrderId = newClientOid
                    order.PE = newPE
                    await order.save()
                    return true
                } else {
                    console.log('order not activated')
                    return false
                }
            } else {
                order.PE = newPE
                await order.save()
            }
        } catch (e) {
            console.log('newPE', newPE)
            console.error('updateOrderPE', e)
        }
    }

    async updateTPOfOrderActivate(client: FuturesClient, order: OrderDocument, newTP: number, takeProfit: TakeProfitDocument): Promise<boolean> {
        try {
            if (order.sendToPlateform && order.activated) {
                if (!takeProfit) return
                const paramsTP: ModifyFuturesPlanStopOrder = {
                    marginCoin: order.marginCoin,
                    orderId: takeProfit.orderId,
                    clientOid: takeProfit.clOrderId.toString(),
                    planType: 'profit_plan',
                    symbol: order.symbol,
                    triggerPrice: newTP.toString(),
                }
                const oldTP = takeProfit.triggerPrice
                const result = await client.modifyStopOrder(paramsTP)
                takeProfit.orderId = result.data.orderId
                takeProfit.triggerPrice = newTP
                await takeProfit.save()
                const TPIndex = order.TPs.findIndex((TP) => TP === oldTP)
                const SL = await this.stopLossModel.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (SL.step === TPIndex - 2) {
                    const paramsSL: ModifyFuturesPlanStopOrder = {
                        marginCoin: order.marginCoin,
                        orderId: SL.orderId,
                        clientOid: SL.clOrderId.toString(),
                        planType: 'loss_plan',
                        symbol: order.symbol,
                        triggerPrice: newTP.toString(),
                    }
                    const result = await client.modifyStopOrder(paramsSL)
                    SL.orderId = result.data.orderId
                    SL.triggerPrice = newTP
                    SL.price = newTP
                    await SL.save()
                }
            }
        } catch (e) {
            console.error('updateTPOfOrderActivate', e)
        }
    }

    async updateTPsOfOrder(client: FuturesClient, order: OrderDocument, newTPs: number[], user: User | null = null): Promise<boolean> {
        if (!user) {
            user = await this.userModel.findById(order.userId)
        }
        const symbolRules = await this.bitgetUtilsService.getSymbolBy(client, 'symbol', order.symbol)
        if (order.sendToPlateform && order.activated) {
            const takeProfits = await this.takeProfitModel
                .find({
                    orderParentId: order._id,
                })
                .sort({ num: order.side === 'long' ? 1 : -1 })
                .exec()

            const totalQuantity = order.quantity - takeProfits.reduce((acc, currentTP) => acc + (currentTP.terminated ? currentTP.quantity : 0), 0)
            const TPList = [...newTPs]
            const takeProfitNotTerminated = []
            for (let i = 0; i < takeProfits.length; i++) {
                if (takeProfits[i].terminated) {
                    TPList.splice(takeProfits[i].num - 1, 1)
                } else {
                    takeProfitNotTerminated.push(takeProfits[i])
                }
            }
            const { TPPrice: newTPsCalculate, TPSize: newTPSizeCalculate } = this.bitgetUtilsService.caculateTPsToUse(
                newTPs,
                totalQuantity,
                user.preferences.order.TPSize,
                symbolRules,
                order.side,
            )
            if (newTPsCalculate.length !== order.TPs.length) {
                // En premier on supprime tout les TPs
                await Promise.all(
                    takeProfitNotTerminated.map(async (takeProfit, i) => {
                        await this.cancelTPOfOrderActivate(client, order, takeProfit)
                    }),
                )
                // Enfin on ajoute les nouveaux trades
                for (let i = 0; i < newTPsCalculate.length; i++) {
                    const newSize = newTPSizeCalculate[i]
                    await this.addTPOfOrderActivate(client, order, newTPsCalculate[i], i + 1, newSize)
                }
            } else {
                for (let i = 0; i < takeProfitNotTerminated.length; i++) {
                    const takeProfit = takeProfitNotTerminated[i]
                    const newTP = newTPsCalculate[i]
                    if (newTP !== takeProfit.triggerPrice) {
                        await this.updateTPOfOrderActivate(client, order, newTP, takeProfit)
                    }
                }
            }

            order.TPs = newTPsCalculate
            order.markModified('TPs')
            await order.save()
        } else {
            const newTPsCalculate = this.bitgetUtilsService.caculateTPsToUse(newTPs, order.quantity, user.preferences.order.TPSize, symbolRules, order.side).TPPrice
            order.TPs = newTPsCalculate
            order.markModified('TPs')
            await order.save()
        }

        return true
    }

    async updateOrderSL(client: FuturesClient, order: OrderDocument, newSL: number): Promise<boolean> {
        try {
            if (order.sendToPlateform && order.activated) {
                const stopLoss = await this.stopLossModel.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (!stopLoss) return false
                const paramsSL: ModifyFuturesPlanStopOrder = {
                    marginCoin: order.marginCoin,
                    orderId: stopLoss.orderId,
                    clientOid: stopLoss.clOrderId.toString(),
                    planType: 'loss_plan',
                    symbol: order.symbol,
                    triggerPrice: newSL.toString(),
                }
                const result = await client.modifyStopOrder(paramsSL)
                stopLoss.orderId = result.data.orderId
                stopLoss.triggerPrice = newSL
                stopLoss.price = newSL
                await stopLoss.save()
            }
            order.SL = newSL
            await order.save()
        } catch (e) {
            console.error('updateOrderSL', e)
        }
    }
}
