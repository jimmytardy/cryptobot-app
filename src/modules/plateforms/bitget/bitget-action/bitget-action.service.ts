import { Injectable, Logger } from '@nestjs/common'
import {
    CancelFuturesPlanTPSL,
    FuturesClient,
    FuturesHoldSide,
    FuturesOrderSide,
    FuturesOrderType,
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
import { StopLoss, StopLossDocument } from 'src/model/StopLoss'
import { OrderService } from 'src/modules/order/order.service'
import { User } from 'src/model/User'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import * as exactMath from 'exact-math'
import { UtilService } from 'src/util/util.service'
import { Symbol } from 'src/model/Symbol'
import { BitgetService } from '../bitget.service'

@Injectable()
export class BitgetActionService {
    logger: Logger = new Logger('BitgetActionService', { timestamp: true })
    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(TakeProfit.name)
        private takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>,
    ) {}

    async setLeverage(client: FuturesClient, symbol: string, newLeverage: number): Promise<number> {
        await Promise.all([
            client.setLeverage(symbol, 'USDT', String(newLeverage), 'long').catch((e) => this.logger.error('setLeverage', e)),
            client.setLeverage(symbol, 'USDT', String(newLeverage), 'short').catch((e) => this.logger.error('setLeverage', e)),
        ])
        return newLeverage
    }

    async setMarginMode(client: FuturesClient, symbol: string) {
        await client.setMarginMode(symbol, 'USDT', 'fixed').catch((e) => this.logger.error('setMarginMode', e))
    }

    async placeOrder(
        client: FuturesClient,
        user: User,
        symbolRules: Symbol,
        side: FuturesOrderSide,
        pe: number,
        tps: number[],
        stopLoss: number,
        size: number,
        leverage: number,
        currentPrice: number,
        linkOrderId?: Types.ObjectId,
        marginCoin = 'USDT',
    ) {
        try {
            const margin = exactMath.round(exactMath.mul(size, pe) / leverage, -3)
            if (size <= 0 || size < parseFloat(symbolRules.minTradeNum)) {
                throw new Error(
                    // @ts-ignore
                    `La quantité ${margin} est trop petite pour un ordre, le minimum est ${symbolRules.minTradeNum}`,
                )
            }
            const sideOrder = side.split('_')[1] as FuturesHoldSide
            let TPsCalculate = this.bitgetUtilsService.caculateTPsToUse(tps, size, user.preferences.order.TPSize, symbolRules, sideOrder).TPPrice
            // @ts-ignore
            if (TPsCalculate.length === 0) throw new Error(`La quantité est trop petite pour la tailles des TPs`)
            const clOrderId = new Types.ObjectId()
            let newOrder = new this.orderModel({
                clOrderId,
                PE: pe,
                TPs: TPsCalculate,
                SL: stopLoss,
                symbol: symbolRules.symbol,
                side: sideOrder,
                linkOrderId,
                quantity: size,
                marginCoin,
                usdt: margin,
                userId: user._id,
                leverage,
            })

            this.orderService.checkNewOrder(newOrder)

            newOrder.sendToPlateform = false;
            const PEOriginPrice = newOrder.PE
            if ((sideOrder === 'long' && newOrder.PE > currentPrice) || (sideOrder === 'short' && newOrder.PE < currentPrice)) {
                newOrder.PE = currentPrice
                return await this.placeOrderBitget(client, newOrder, 'market')
            } else {
                try {
                    newOrder.PE = currentPrice
                    if (sideOrder === 'long') {
                        newOrder.PE = exactMath.mul(newOrder.PE, exactMath.sub(1, Number(symbolRules.buyLimitPriceRatio)))
                    } else {
                        newOrder.PE = exactMath.mul(newOrder.PE, exactMath.add(1, Number(symbolRules.sellLimitPriceRatio)))
                    }
                    newOrder.PE = this.bitgetUtilsService.fixPriceByRules(newOrder.PE, symbolRules)
                    newOrder = await this.placeOrderBitget(client, newOrder)
                    newOrder.sendToPlateform = true;
                    await this.updateOrderPE(client, newOrder, PEOriginPrice)
                } catch (e) {
                    this.logger.error('placeOrder > manual place order', e)
                    throw e
                } finally {
                    newOrder.PE = PEOriginPrice
                }
            }

            return await newOrder.save()
        } catch (e) {
            this.logger.error('placeOrder', e)
            throw e
        }
    }

    async placeOrderBitget(client: FuturesClient, order: Order, orderType: FuturesOrderType = 'limit') {
        const newOrderParams: NewFuturesOrder = {
            marginCoin: order.marginCoin,
            orderType,
            side: ('open_' + order.side) as FuturesOrderSide,
            size: String(order.quantity),
            symbol: order.symbol,
            clientOid: order.clOrderId.toString(),
            ...(orderType === 'limit' ? { price: String(order.PE) } : {})
        }
        const result = await client.submitOrder(newOrderParams).catch((e) => {
            this.logger.error('placeOrderBitget', e, newOrderParams)
            e.paramsSend = newOrderParams
            throw e
        })
        const { orderId } = result.data
        order.orderId = orderId
        order.sendToPlateform = true
        return await this.orderModel.findOneAndUpdate({ _id: order._id }, order, { new: true, upsert: true })
    }

    async activeOrder(client: FuturesClient, orderId: Types.ObjectId, user: User, orderBitget: any) {
        try {
            const quantity = parseFloat(orderBitget.fillSz || orderBitget.sz);
            const PE = parseFloat(orderBitget.fillPx || orderBitget.px);
            const leverage = parseFloat(orderBitget.lever);
            const order = await this.orderModel.findOneAndUpdate({ 
                _id: orderId, 
                inActivation: { $ne: true }, 
                activated: false 
            }, { 
                $set: { 
                    inActivation: true, 
                    quantity,
                    PE,
                    leverage,
                } 
            }, { new: true })
            if (!order || order.activated) return null
            const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
            if (!symbolRules) throw new Error('Symbol not found')
            // important for active TPs
            order.activated = true
            await this.activeSL(client, symbolRules, order)
            await this.activeTPs(client, user, symbolRules, order)
            order.inActivation = false
            await order.save()
        } catch (e) {
            this.logger.error('error activeOrder', e)
            throw e
        }
    }

    private async activeSL(client: FuturesClient, symbolRules: FuturesSymbolRule, order: Order) {
        try {
            const TPQuantityClose = await this.takeProfitModel.find({
                orderParentId: order._id,
                terminated: true,
            });
            const totalQuantity = exactMath.sub(order.quantity, TPQuantityClose.reduce((acc, currentTP) => acc + currentTP.quantity, 0));
            const clientOid = new Types.ObjectId()
            const params: NewFuturesPlanStopOrder = {
                symbol: symbolRules.symbol,
                size: totalQuantity.toString(),
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
            this.logger.error('activeSL', e)
        }
    }

    async replaceTPOfOrderActivate(client: FuturesClient, order: Order, takeProfit: TakeProfitDocument, num: number, newTP: number, newSize: number) {
        if (!order.sendToPlateform || !order.activated) return
        try {
            if (!takeProfit) return
            await this.cancelTPOfOrderActivate(client, order, takeProfit)
            await this.addTPOfOrderActivate(client, order, newTP, num, newSize)
        } catch (e) {
            this.logger.error('replaceTPOfOrderActivate', e)
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
            await client.cancelPlanOrderTPSL(params).catch(e => this.logger.error('cancelTPOfOrderActivate > bitget', e));
            await this.takeProfitModel.deleteOne({ _id: takeProfit._id })
        } catch (e) {
            this.logger.error('cancelTPOfOrderActivate', e)
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
            this.logger.error('addTPOfOrderActivate', e, num, params)
        }
    }

    private async activeTPs(client: FuturesClient, user: User, symbolRules: FuturesSymbolRule, order: Order) {
        const TPSize = this.bitgetUtilsService.caculateTPsToUse(order.TPs, order.quantity, user.preferences.order.TPSize, symbolRules, order.side).TPSize
        for (let i = 0; i < TPSize.length; i++) {
            const size = TPSize[i]
            const TP = order.TPs[i]
            try {
                await this.addTPOfOrderActivate(client, order, TP, i + 1, size)
            } catch (e) {
                this.logger.error(
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
                stepsTriggers = UtilService.sortBySide(stepsTriggers.concat(order.TPs), order.side)
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
            this.logger.error('upgradeSL', e, order, strategy, numTP, stopLoss)
            throw e
        }
    }

    async cancelOrder(client: FuturesClient, userId: Types.ObjectId, order: Order) {
        try {
            if (order.sendToPlateform && order.orderId && !order.terminated) {
                if (!order.activated) {
                    try {
                        await client.cancelOrder(order.symbol, order.marginCoin, undefined, order.clOrderId?.toString())
                    } catch (e) {
                        if (e.body.code !== '40768') {
                            // order not exists
                            this.logger.error('cancelOrder > client', e)
                        }
                    }
                }
            }
            await this.orderService.cancelOrder(order._id, userId)
        } catch (e) {
            this.logger.error('cancelOrder', e)
        }
    }

    async closePosition(client: RestClientV2, userId: Types.ObjectId, symbol: string) {
        try {
            const symbolV2 = this.bitgetUtilsService.convertSymbolToV2(symbol)
            const position = await client.getFuturesPosition({
                productType: 'USDT-FUTURES',
                symbol: symbolV2,
                marginCoin: 'USDT',
            })
            if (position.data && position.data.length > 0) {
                await client.futuresFlashClosePositions({
                    symbol: symbolV2,
                    productType: 'USDT-FUTURES',
                })
            }
            await this.orderModel.updateMany(
                {
                    terminated: false,
                    activated: true,
                    symbol,
                    userId,
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            )

            await this.takeProfitModel.updateMany(
                {
                    terminated: false,
                    symbol,
                    userId,
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            )
            await this.stopLossModel.updateMany(
                {
                    terminated: false,
                    symbol,
                    userId,
                },
                {
                    terminated: true,
                    cancelled: true,
                },
                {
                    new: true,
                },
            )
        } catch (e) {
            this.logger.error('closePosition', e)
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
                    console.info('order not activated')
                    return false
                }
            } else {
                order.PE = newPE
                await order.save()
            }
        } catch (e) {
            this.logger.error('newPE', newPE)
            this.logger.error('updateOrderPE', e)
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
                const result = await client.modifyStopOrder(paramsTP)
                takeProfit.orderId = result.data.orderId
                takeProfit.triggerPrice = newTP
                await takeProfit.save()
                const SL = await this.stopLossModel.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (SL.step === takeProfit.num + 1) {
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
            this.logger.error('updateTPOfOrderActivate', e, order.toObject(), newTP, takeProfit.toObject())
        }
    }

    async updateTPsOfOrder(client: FuturesClient, order: OrderDocument, newTPs: number[], user: User | null = null): Promise<boolean> {
        if (!user) {
            user = await this.userModel.findById(order.userId)
        }
        const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
        if (order.sendToPlateform && order.activated) {
            const takeProfits = await this.takeProfitModel
                .find({
                    orderParentId: order._id,
                })
                .sort({ num: order.side === 'long' ? 1 : -1 })
                .exec()

            const orderBitget = (await client.getOrder(order.symbol, order.orderId, order.clOrderId?.toString())).data;
            order.quantity = parseFloat(orderBitget.size);
            const totalQuantity =  exactMath.sub(order.quantity, takeProfits.reduce((acc, currentTP) => acc + (currentTP.terminated ? currentTP.quantity : 0), 0));
            const TPList = [...newTPs]
            const takeProfitNotTerminated = []
            for (let i = 0; i < takeProfits.length; i++) {
                if (takeProfits[i].terminated) {
                    TPList.splice(takeProfits[i].num - 1, 1);
                } else {
                    takeProfitNotTerminated.push(takeProfits[i])
                }
            }
            const { TPPrice: newTPsCalculate, TPSize: newTPSizeCalculate } = this.bitgetUtilsService.caculateTPsToUse(
                TPList,
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
                const orderBitget = (await client.getOrder(order.symbol, order.orderId, order.clOrderId?.toString())).data;
                order.quantity = parseFloat(orderBitget.size);
                let stopLoss: StopLossDocument = await this.stopLossModel.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (!stopLoss) {
                    order.SL = newSL;
                    const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
                    await this.activeSL(client, symbolRules, order)
                } else {
                    const paramsSL: ModifyFuturesPlanStopOrder = {
                        marginCoin: order.marginCoin,
                        orderId: stopLoss.orderId,
                        clientOid: stopLoss.clOrderId.toString(),
                        planType: 'loss_plan',
                        symbol: order.symbol,
                        triggerPrice: newSL.toString(),
                    }
                    try {
                        const result = await client.modifyStopOrder(paramsSL)
                        stopLoss.orderId = result.data.orderId
                        stopLoss.triggerPrice = newSL
                        stopLoss.price = newSL
                        await stopLoss.save()
                    } catch(e) {
                        const symbolv2 = this.bitgetUtilsService.convertSymbolToV2(order.symbol);
                        const history = await BitgetService.getClientV2(order.userId).getFuturesPlanOrders({
                            planType: 'profit_loss',
                            symbol: symbolv2,
                            productType: 'USDT-FUTURES'
                        })
                        const stopLossBitget = history.data?.entrustedList?.find((item) => item.planType === 'loss_plan' && item.planStatus === 'live' && Types.ObjectId.isValid(item.clientOid) && (
                            [...order.TPs, order.SL].includes(parseFloat(item.triggerPrice || 0)) ||
                            [...order.TPs, order.SL].includes(parseFloat(item.stopLossTriggerPrice || 0)) ||
                            order.quantity === parseFloat(item.size)
                        ));
                        if (stopLossBitget) {
                            await client.cancelPlanOrderTPSL({
                                marginCoin: 'USDT',
                                planType: 'loss_plan',
                                symbol: order.symbol,
                                clientOid: stopLossBitget.clientOid,
                                orderId: stopLossBitget.orderId
                            }).catch(this.logger.error)
                        }
                        await stopLoss.deleteOne();
                        return this.updateOrderSL(client, order, newSL);
                    }
                    
                }
            }
            order.SL = newSL
            await order.save()
            return true
        } catch (e) {
            this.logger.error('updateOrderSL', e)
            return false
        }
    }
}
