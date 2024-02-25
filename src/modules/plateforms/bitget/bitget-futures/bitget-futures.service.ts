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
import { Order } from 'src/model/Order'
import { OrderService } from 'src/modules/order/order.service'
import * as exactMath from 'exact-math'
import { Types } from 'mongoose'
import { StopLossService } from 'src/modules/order/stop-loss/stop-loss.service'
import { TakeProfit, TakeProfitDocument } from 'src/model/TakeProfit'
import { TakeProfitService } from 'src/modules/order/take-profit/take-profit.service'
import { BitgetUtilsService } from '../bitget-utils/bitget-utils.service'
import { TPSizeType, User } from 'src/model/User'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { StopLoss } from 'src/model/StopLoss'
import { BitgetService } from '../bitget.service'
import { ErrorTraceService } from 'src/modules/error-trace/error-trace.service'
import { ErrorTraceSeverity } from 'src/model/ErrorTrace'
import { Symbol } from 'src/model/Symbol'
import { IOrderEventData } from '../bitget-ws/bitget-ws.interface'
import { UtilService } from 'src/util/util.service'
import { PositionService } from 'src/modules/position/position.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class BitgetFuturesService {
    logger: Logger = new Logger('BitgetFuturesService')
    constructor(
        private configService: ConfigService,
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        private stopLossService: StopLossService,
        private takeProfitService: TakeProfitService,
        private errorTraceService: ErrorTraceService,
        private positionService: PositionService,
    ) {}

    async setLeverage(client: FuturesClient, symbol: string, newLeverage: number, side: FuturesHoldSide): Promise<void> {
        await client
            .setLeverage(symbol, BitgetService.MARGIN_MODE, String(newLeverage), side)
            .catch((e) => this.errorTraceService.createErrorTrace('setLeverage', null, ErrorTraceSeverity.ERROR, { symbol, newLeverage, side, error: e }))
    }

    async setMarginMode(client: FuturesClient, symbol: string) {
        await client
            .setMarginMode(symbol, BitgetService.MARGIN_MODE, 'fixed')
            .catch((e) => this.errorTraceService.createErrorTrace('setMarginMode', null, ErrorTraceSeverity.ERROR, { symbol, error: e }))
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
        marginCoin = BitgetService.MARGIN_MODE,
    ) {
        try {
            const margin = this.bitgetUtilsService.getMarginFromPosition(pe, size, leverage)
            if (size <= 0 || size < parseFloat(symbolRules.minTradeNum)) {
                throw new Error(
                    // @ts-ignore
                    `La quantité ${margin} est trop petite pour un ordre, le minimum est ${symbolRules.minTradeNum}`,
                )
            }
            const sideOrder = side.split('_')[1] as FuturesHoldSide
            let TPsCalculate = this.bitgetUtilsService.caculateTPsToUse(tps, size, user.preferences.order.TPSize, symbolRules, sideOrder).TPPrice
            // @ts-ignore
            if (TPsCalculate.length === 0) throw new Error(`La quantité est trop petite pour la taille des TPs`)
            const clOrderId = new Types.ObjectId()
            let newOrder: Order = {
                _id: new Types.ObjectId(),
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
                sendToPlateform: false,
                activated: false,
                terminated: false,
                leverage,
                strategy: user.preferences.order.strategy,
            } as Order
            this.orderService.validateOrder(newOrder)

            newOrder.sendToPlateform = false
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
                    await this.updatePE(client, newOrder, PEOriginPrice)
                } catch (e) {
                    this.errorTraceService.createErrorTrace('placeOrder > manual place order', user._id, ErrorTraceSeverity.IMMEDIATE, {
                        newOrder,
                        error: e,
                    })
                    throw e
                } finally {
                    newOrder.PE = PEOriginPrice
                }
            }
            return await this.orderService.updateOne(newOrder, { new: true, upsert: true })
        } catch (e) {
            this.errorTraceService.createErrorTrace('placeOrder', user._id, ErrorTraceSeverity.IMMEDIATE, {
                user,
                symbolRules,
                side,
                pe,
                tps,
                stopLoss,
                size,
                leverage,
                currentPrice,
                linkOrderId,
                marginCoin,
                error: e,
            })
            throw e
        }
    }

    async placeOrderBitget(client: FuturesClient, order: Order, orderType: FuturesOrderType = 'limit') {
        if (order.sendToPlateform || order.terminated || order.activated) return
        const newOrderParams: NewFuturesOrder = {
            marginCoin: order.marginCoin,
            orderType,
            side: ('open_' + order.side) as FuturesOrderSide,
            size: String(order.quantity),
            symbol: order.symbol,
            clientOid: order.clOrderId.toString(),
            ...(orderType === 'limit' && { price: String(order.PE) }),
        }
        try {
            const result = await client.submitOrder(newOrderParams)
            const { orderId } = result.data
            order.orderId = orderId
            order.sendToPlateform = true
            return await this.orderService.updateOne(order, { new: true, upsert: true })
        } catch (e) {
            this.errorTraceService.createErrorTrace('placeOrderBitget', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                error: e,
                params: newOrderParams,
            })
        }
    }

    async activeOrder(client: FuturesClient, orderId: Types.ObjectId, user: User, orderBitget: IOrderEventData) {
        try {
            const quantity = parseFloat(orderBitget.size)
            const PE = parseFloat(orderBitget.fillPrice || orderBitget.priceAvg)
            const leverage = parseFloat(orderBitget.leverage)
            const order = await this.orderService.getOrderForActivation(orderId, { PE, quantity, leverage })
            if (!order || order.activated) return null
            let orderAlreadActived = await this.orderService.findOne({ linkOrderId: order.linkOrderId, userId: user._id, activated: true, terminated: false })
            if (orderAlreadActived) {
                orderAlreadActived.quantity = exactMath.add(orderAlreadActived.quantity, quantity)
                orderAlreadActived.usdt = exactMath.add(orderAlreadActived.usdt, this.bitgetUtilsService.getMarginFromPosition(PE, quantity, leverage))
                orderAlreadActived.PEsTriggered = [...(orderAlreadActived.PEsTriggered || [orderAlreadActived.PE]), PE]
                orderAlreadActived.clientOids = [...(orderAlreadActived.clientOids || [orderAlreadActived.clOrderId]), order.clOrderId]
                orderAlreadActived.PE = exactMath.div(
                    orderAlreadActived.PEsTriggered.reduce((a, b) => exactMath.add(a, b), 0),
                    orderAlreadActived.PEsTriggered.length,
                )
                await this.orderService.updateOne(orderAlreadActived)
                await this.updateTakeProfits(client, orderAlreadActived, orderAlreadActived.TPs, user.preferences.order.TPSize)
                await this.updateStopLoss(BitgetService.getClientV2(orderAlreadActived.userId), orderAlreadActived, orderAlreadActived.SL)
                await this.orderService.deleteOne(order._id)
            } else {
                const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
                if (!symbolRules) throw new Error('Symbol not found')

                // important for active TPs
                order.activated = true
                order.PEsTriggered = [PE]
                await UtilService.sleep(1000) // tempo to avoid error on bitget
                await this.activeSL(client, order)
                await UtilService.sleep(1000) // tempo to avoid error on bitget
                await this.activeTPs(client, user.preferences.order.TPSize, symbolRules, order)
                order.inActivation = false
                await this.orderService.updateOne(order)
            }
        } catch (e) {
            this.errorTraceService.createErrorTrace('activeOrder', user._id, ErrorTraceSeverity.IMMEDIATE, {
                orderId,
                user,
                orderBitget,
                error: e,
            })
        }
    }

    async activeTPs(client: FuturesClient, tpSize: TPSizeType, symbolRules: FuturesSymbolRule, order: Order) {
        const TPSize = this.bitgetUtilsService.caculateTPsToUse(order.TPs, order.quantity, tpSize, symbolRules, order.side).TPSize
        for (let i = 0; i < TPSize.length; i++) {
            const size = TPSize[i]
            const TP = order.TPs[i]
            try {
                await this.addTakeProfit(client, order, TP, i + 1, size)
            } catch (e) {
                this.errorTraceService.createErrorTrace('activeTPs', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                    order,
                    tpSize,
                    symbolRules,
                    TPSize,
                    i,
                    size,
                    TP,
                    error: e,
                })
            }
        }
    }

    async activeSL(client: FuturesClient, order: Order) {
        const totalQuantity = await this.orderService.getQuantityAvailable(order._id, order)
        try {
            if (totalQuantity === 0) return
            const SLTrigger = await this.orderService.getSLTriggerCurrentFromOrder(order)
            const clientOid = new Types.ObjectId()
            const params: NewFuturesPlanStopOrder = {
                symbol: order.symbol,
                size: totalQuantity.toString(),
                marginCoin: order.marginCoin,
                planType: 'loss_plan',
                triggerType: 'fill_price',
                triggerPrice: String(SLTrigger),
                holdSide: order.side,
                clientOid: clientOid.toString(),
            }
            const result = await client.submitStopOrder(params)
            const { orderId } = result.data
            return await this.stopLossService.createFromOrder(order, totalQuantity, clientOid, orderId)
        } catch (e) {
            this.errorTraceService.createErrorTrace('activeSL', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                totalQuantity,
                error: e,
            })
        }
    }

    async cancelTakeProfit(client: FuturesClient, takeProfit: TakeProfit, deleteTakeProfit = false, ignoreError = false) {
        try {
            if (!takeProfit.terminated) {
                const params: CancelFuturesPlanTPSL = {
                    marginCoin: takeProfit.marginCoin,
                    planType: 'profit_plan',
                    symbol: takeProfit.symbol,
                    clientOid: takeProfit.clOrderId.toString(),
                    orderId: takeProfit.orderId,
                }
                await client.cancelPlanOrderTPSL(params)
            }
            if (deleteTakeProfit) {
                await this.takeProfitService.deleteOne({ _id: takeProfit._id })
            } else {
                takeProfit.cancelled = true
                takeProfit.terminated = true
                await this.takeProfitService.updateOne(takeProfit)
            }
        } catch (e) {
            if (!ignoreError) {
                this.errorTraceService.createErrorTrace('cancelTakeProfit', takeProfit.userId, ErrorTraceSeverity.ERROR, {
                    takeProfit,
                    error: e,
                })
            }
        }
    }

    async cancelStopLoss(client: FuturesClient, stopLoss: StopLoss, deleteStopLoss = false, ignoreError = false, forceDelete = false) {
        try {
            if (!stopLoss.terminated || forceDelete) {
                const params: CancelFuturesPlanTPSL = {
                    marginCoin: stopLoss.marginCoin,
                    planType: 'loss_plan',
                    symbol: stopLoss.symbol,
                    clientOid: stopLoss.clOrderId.toString(),
                    orderId: stopLoss.orderId,
                }
                await client.cancelPlanOrderTPSL(params)
            }
            if (deleteStopLoss) {
                await this.stopLossService.deleteOne(stopLoss._id)
            } else {
                stopLoss.cancelled = true
                stopLoss.terminated = true
                await this.stopLossService.updateOne(stopLoss)
            }
        } catch (e) {
            if (!ignoreError) {
                this.errorTraceService.createErrorTrace('cancelStopLoss', stopLoss.userId, ErrorTraceSeverity.ERROR, {
                    stopLoss,
                    error: e,
                })
            }
        }
    }

    async addTakeProfit(client: FuturesClient, order: Order, triggerPrice: number, num: number, quantity: number) {
        if (!order.activated) throw new Error("We can't add TakeProfit on order not activated")
        const quantityAvailable = await this.orderService.getQuantityAvailable(order._id, order)
        if (quantityAvailable < quantity) throw new Error(`There is no quantity available: ${quantityAvailable} (available) < ${quantity} (desired)`)
        const clOrderId = new Types.ObjectId()
        const params: NewFuturesPlanStopOrder = {
            symbol: order.symbol,
            marginCoin: order.marginCoin,
            planType: 'profit_plan',
            triggerPrice: triggerPrice.toString(),
            size: quantity.toString(),
            triggerType: 'fill_price',
            holdSide: order.side,
            clientOid: clOrderId.toString(),
        }
        try {
            const result = await client.submitStopOrder(params)
            const { orderId } = result.data
            await this.takeProfitService.createFromOrder(order, triggerPrice, quantity, num, clOrderId, orderId)
        } catch (e) {
            this.errorTraceService.createErrorTrace('addTakeProfit', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                triggerPrice,
                quantityAvailable,
                num,
                quantity,
                clOrderId,
                params,
                error: e,
            })
        }
    }

    async replaceTakeProfit(client: FuturesClient, order: Order, takeProfit: TakeProfit, newTP: number, newSize: number) {
        try {
            if (!takeProfit) return
            await this.cancelTakeProfit(client, takeProfit, true)
            await this.addTakeProfit(client, order, newTP, takeProfit.num, newSize)
        } catch (e) {
            this.errorTraceService.createErrorTrace('replaceTakeProfit', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                takeProfit,
                newTP,
                newSize,
                error: e,
            })
        }
    }

    async upgradeStopLoss(clientV2: RestClientV2, order: Order, numTP: number): Promise<StopLoss> {
        const symbolV2 = this.bitgetUtilsService.convertSymbolToV2(order.symbol)
        const position = await this.positionService.findOneAndUpdate(
            { userId: order.userId, symbol: symbolV2, 'synchroExchange.SL': true },
            { $set: { 'synchroExchange.SL': false } },
            { lean: true },
        )
        if (!position) return
        let stopLoss = await this.stopLossService.findOne(
            {
                orderParentId: order._id,
                terminated: { $ne: true },
            },
            undefined,
            { lean: true },
        )
        try {
            if (!stopLoss) {
                await this.positionService.findOneAndUpdate({ userId: order.userId, symbol: symbolV2 }, { 'synchroExchange.SL': true })
                stopLoss = await this.activeSL(BitgetService.getClient(order.userId), order)
                if (!stopLoss) throw new Error('No stopLoss found')
                return stopLoss
            }

            let newStep = this.stopLossService.getNewStep(numTP, order.strategy)
            const triggerPrice = await this.orderService.getSLTriggerFromStep(order, newStep)
            stopLoss.quantity = await this.orderService.getQuantityAvailable(order._id, order)
            stopLoss.step = newStep
            const params = {
                orderId: stopLoss.orderId,
                clientOid: stopLoss.clOrderId.toString(),
                marginCoin: stopLoss.marginCoin,
                productType: BitgetService.PRODUCT_TYPEV2,
                symbol: this.bitgetUtilsService.convertSymbolToV2(stopLoss.symbol),
                planType: 'loss_plan',
                triggerPrice: triggerPrice.toString(),
                triggerType: 'fill_price',
                executePrice: stopLoss.triggerPrice.toString(),
                size: stopLoss.quantity.toString(),
            }
            const { data } = await clientV2.futuresModifyTPSLPOrder(params)
            stopLoss.orderId = data.orderId
            stopLoss.historyTrigger = [...stopLoss.historyTrigger, stopLoss.triggerPrice]
            stopLoss.triggerPrice = triggerPrice
            stopLoss = await this.stopLossService.updateOne(stopLoss, { new: true })
        } catch (e) {
            this.errorTraceService.createErrorTrace('upgradeSL', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                numTP,
                stopLoss,
                error: e,
            })
        } finally {
            await this.positionService.findOneAndUpdate({ userId: order.userId, symbol: symbolV2 }, { 'synchroExchange.SL': true })
            return stopLoss
        }
    }

    async updateStopLoss(clientV2: RestClientV2, order: Order, newSL?: number): Promise<boolean> {
        try {
            order.SL = newSL
            await this.orderService.updateOne(order)
            if (order.sendToPlateform && order.activated && !order.terminated) {
                const stopLoss: StopLoss = await this.stopLossService.findOne({
                    orderParentId: order._id,
                })
                const quantityAvailable = await this.orderService.getQuantityAvailable(order._id, order)
                if (quantityAvailable === 0) return
                const triggerPrice = await this.orderService.getSLTriggerCurrentFromOrder(order)
                if (!stopLoss || stopLoss.terminated) {
                    await this.cancelStopLoss(BitgetService.getClient(order.userId), stopLoss, true, true, true) // en cas d'erreur de process on clean la SL
                    await this.activeSL(BitgetService.getClient(order.userId), order)
                    return
                } else if (triggerPrice !== stopLoss.triggerPrice || quantityAvailable !== stopLoss.quantity) {
                    const params: any = {
                        orderId: stopLoss.orderId,
                        clientOid: stopLoss.clOrderId.toString(),
                        marginCoin: stopLoss.marginCoin,
                        productType: BitgetService.PRODUCT_TYPEV2,
                        symbol: this.bitgetUtilsService.convertSymbolToV2(stopLoss.symbol),
                        triggerPrice: triggerPrice.toString(),
                        triggerType: 'fill_price'
                    }
                    if (quantityAvailable !== stopLoss.quantity) params.size = quantityAvailable.toString()
                    try {
                        const { data } = await clientV2.futuresModifyTPSLPOrder(params)
                        stopLoss.orderId = data.orderId
                        if (newSL) stopLoss.triggerPrice = newSL
                        stopLoss.quantity = quantityAvailable
                        await this.stopLossService.updateOne(stopLoss, { new: true })
                    } catch (e) {
                        this.errorTraceService.createErrorTrace('updateStopLoss', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                            order,
                            newSL,
                            stopLoss,
                            params,
                            error: e,
                        })
                        return false
                    }
                }
            }
            return true
        } catch (e) {
            this.errorTraceService.createErrorTrace('updateStopLoss', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                newSL,
                error: e,
            })
            return false
        }
    }

    async updateTakeProfit(clientV2: RestClientV2, order: Order, takeProfit: TakeProfit, newTP: number, newSize: number): Promise<void> {
        try {
            if (order.sendToPlateform && order.activated && takeProfit) {
                if (!takeProfit.terminated && (takeProfit.triggerPrice !== newTP || takeProfit.quantity !== newSize)) {
                    const params = {
                        orderId: takeProfit.orderId,
                        clientOid: takeProfit.clOrderId.toString(),
                        marginCoin: takeProfit.marginCoin,
                        productType: BitgetService.PRODUCT_TYPEV2,
                        symbol: this.bitgetUtilsService.convertSymbolToV2(takeProfit.symbol),
                        triggerPrice: newTP.toString(),
                        triggerType: 'fill_price',
                        size: newSize.toString(),
                    }
                    const { data } = await clientV2.futuresModifyTPSLPOrder(params)
                    takeProfit.orderId = data.orderId
                } else if (takeProfit.terminated) {
                    // TODO update SL if is current step
                }
                takeProfit.triggerPrice = newTP
                takeProfit.quantity = newSize
                await this.takeProfitService.updateOne(takeProfit)
            }
        } catch (e) {
            if (e.body.code === '40830' && (this.configService.get('ENV') as string).toUpperCase() === 'DEV') return
            this.errorTraceService.createErrorTrace('updateTakeProfit', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                newTP,
                takeProfit,
                error: e,
            })
        }
    }

    // async recreateTakeProfits(client: FuturesClient, order: Order, newTPs: number[], TPSize: TPSizeType): Promise<boolean> {
    //     try {
    //         await Promise.all(
    //             takeProfitNotTerminated.map(async (takeProfit) => {
    //                 await this.cancelTakeProfit(client, takeProfit, true)
    //             }),
    //         )
    //         const startNum = takeProfitNotTerminated[0].num
    //         // Enfin on ajoute les nouveaux trades
    //         for (let i = 0; i < newTPPricesCalculate.length; i++) {
    //             const newSize = newTPSizeCalculate[i]
    //             await this.addTakeProfit(client, order, newTPPricesCalculate[i], startNum + i, newSize)
    //         }
    //     } catch (e) {

    //     }
    // }

    async updateTakeProfits(client: FuturesClient, order: Order, newTPs: number[], TPSize: TPSizeType): Promise<boolean> {
        try {
            const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
            if (order.sendToPlateform && order.activated) {
                const takeProfits = await this.takeProfitService.findAll(
                    {
                        orderParentId: order._id,
                        cancelled: false,
                    },
                    undefined,
                    { sort: { num: order.side === 'long' ? 1 : -1 }, lean: true },
                )

                const totalQuantity = await this.orderService.getQuantityAvailable(order._id, order)
                const TPList = [...newTPs]
                const takeProfitNotTerminated = []
                const TPPriceTerminated = []
                for (let i = 0; i < takeProfits.length; i++) {
                    if (takeProfits[i].activated || takeProfits[i].terminated) {
                        TPList.splice(takeProfits[i].num - 1, 1)
                        TPPriceTerminated.push(takeProfits[i].triggerPrice)
                    } else {
                        takeProfitNotTerminated.push(takeProfits[i])
                    }
                }
                const { TPPrice: newTPPricesCalculate, TPSize: newTPSizeCalculate } = this.bitgetUtilsService.caculateTPsToUse(
                    TPList,
                    totalQuantity,
                    TPSize,
                    symbolRules,
                    order.side,
                )
                await Promise.all(
                    takeProfitNotTerminated.map(async (takeProfit) => {
                        await this.cancelTakeProfit(client, takeProfit, true)
                    }),
                )
                const startNum = takeProfitNotTerminated.reduce((a, b) => (a < b.num ? a : b.num), 1000)
                // Enfin on ajoute les nouveaux trades
                for (let i = 0; i < newTPPricesCalculate.length; i++) {
                    const newSize = newTPSizeCalculate[i]
                    await this.addTakeProfit(client, order, newTPPricesCalculate[i], startNum + i, newSize)
                }

                order.TPs = [...TPPriceTerminated, ...newTPPricesCalculate]
            } else {
                const newTPsCalculate = this.bitgetUtilsService.caculateTPsToUse(newTPs, order.quantity, TPSize, symbolRules, order.side).TPPrice
                order.TPs = newTPsCalculate
            }
            await this.orderService.updateOne(order)
            return true
        } catch (e) {
            this.errorTraceService.createErrorTrace('updateTakeProfits', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                newTPs,
                TPSize,
                error: e,
            })
            return false
        }
    }

    async updatePE(client: FuturesClient, order: Order, newPE: number): Promise<boolean> {
        try {
            if (order.sendToPlateform) {
                if (!order.activated && (order.orderId || order.clOrderId)) {
                    const newClientOid = new Types.ObjectId()
                    const params: ModifyFuturesOrder = {
                        symbol: order.symbol,
                        clientOid: order.clOrderId?.toString(),
                        newClientOid: newClientOid.toString(),
                        price: String(newPE),
                        size: order.quantity.toString(),
                    }
                    await client.modifyOrder(params)
                    order.clOrderId = newClientOid
                    order.PE = newPE
                    await this.orderService.updateOne(order)
                    return true
                } else {
                    this.errorTraceService.createErrorTrace('updatePE', order.userId, ErrorTraceSeverity.INFO, {
                        order,
                        newPE,
                        error: 'Order activated',
                    })
                    return false
                }
            } else {
                order.PE = newPE
                await this.orderService.updateOne(order)
                return true
            }
        } catch (e) {
            this.errorTraceService.createErrorTrace('updatePE', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                newPE,
                error: e,
            })
        }
    }

    async cancelTakeProfitsFromOrder(client: FuturesClient, orderId: Types.ObjectId, order: Order = null, deleteTakeProfit = false, ignoreError = false) {
        if (!order) order = await this.orderService.findOne({ _id: orderId })
        try {
            if (!order) throw new Error('Order not found')
            const takeProfits = await this.takeProfitService.findAll({ orderParentId: order._id, terminated: false })
            await Promise.all(
                takeProfits.map(async (takeProfit) => {
                    await this.cancelTakeProfit(client, takeProfit, deleteTakeProfit, ignoreError)
                }),
            )
        } catch (e) {
            this.errorTraceService.createErrorTrace('cancelTakeProfitsFromOrder', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                error: e,
            })
        }
    }

    async cancelOrder(clientV2: RestClientV2, order: Order) {
        // TODO quand on close un order qui as déjà eu des TP ça plante sur la fermeture de la quantité précise
        try {
            if (!order.terminated) {
                try {
                    if (order.sendToPlateform && order.orderId) {
                        if (!order.activated) {
                            await clientV2.futuresCancelOrder({
                                symbol: this.bitgetUtilsService.convertSymbolToV2(order.symbol),
                                productType: BitgetService.PRODUCT_TYPEV2,
                                marginCoin: order.marginCoin,
                                clientOid: order.clOrderId.toString(),
                            })
                        } else {
                            const quantityAvailable = await this.orderService.getQuantityAvailable(order._id, order)
                            const side = order.side === 'long' ? 'buy' : 'sell'
                            const stopLoss = await this.stopLossService.findOne({ orderParentId: order._id, terminated: false })
                            const client = BitgetService.getClient(order.userId)
                            await this.cancelStopLoss(client, stopLoss)
                            await this.cancelTakeProfitsFromOrder(client, order._id, order)
                            // cancel exact quantity of order => when is possibility with SDK + cancel all TP and SL
                            await clientV2.futuresSubmitOrder({
                                symbol: this.bitgetUtilsService.convertSymbolToV2(order.symbol),
                                productType: BitgetService.PRODUCT_TYPEV2,
                                marginMode: 'isolated',
                                marginCoin: order.marginCoin,
                                orderType: 'market',
                                size: quantityAvailable.toString(),
                                side,
                                tradeSide: 'close',
                                reduceOnly: 'yes',
                            })
                        }
                    }
                } catch (e) {
                    let traceSeverity: ErrorTraceSeverity = ErrorTraceSeverity.IMMEDIATE
                    if (e.body.code !== '40768') {
                        // order not exists
                        traceSeverity = ErrorTraceSeverity.ERROR
                    }
                    console.trace(e)
                    this.errorTraceService.createErrorTrace('cancelOrder', order.userId, traceSeverity, {
                        order,
                        error: e,
                    })
                } finally {
                    await this.orderService.cancelOrder(order._id)
                }
            }
        } catch (e) {
            this.errorTraceService.createErrorTrace('cancelOrder', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                error: e,
            })
        }
    }

    async disabledOrderLink(clientv2: RestClientV2, linkId: Types.ObjectId, userId: Types.ObjectId) {
        const orders = await this.orderService.findAll({
            linkOrderId: linkId,
            terminated: false,
            activated: false,
            userId,
        })
        await Promise.all(
            orders.map(async (order) => {
                await this.cancelOrder(clientv2, order)
            }),
        )
        await this.orderService.disabledOrderLink(linkId, userId)
    }

    async closePosition(client: RestClientV2, userId: Types.ObjectId, symbol: string) {
        try {
            const symbolV2 = this.bitgetUtilsService.convertSymbolToV2(symbol)
            const position = await client.getFuturesPosition({
                productType: BitgetService.PRODUCT_TYPEV2,
                symbol: symbolV2,
                marginCoin: BitgetService.MARGIN_MODE,
            })
            if (position.data && position.data.length > 0) {
                await client.futuresFlashClosePositions({
                    symbol: symbolV2,
                    productType: BitgetService.PRODUCT_TYPEV2,
                })
            }
            await this.orderService.closeAllOrderOnSymbol(userId, symbol)
        } catch (e) {
            this.errorTraceService.createErrorTrace('closePosition', userId, ErrorTraceSeverity.ERROR, {
                userId,
                symbol,
                error: e,
            })
        }
    }

    async synchronizeAllSL(clientV2: RestClientV2, userId: Types.ObjectId, symbol: string) {
        const symbolV2 = this.bitgetUtilsService.convertSymbolToV2(symbol)
        const position = await this.positionService.findOneAndUpdate({ userId, symbol: symbolV2, 'synchroExchange.SL': true }, { 'synchroExchange.SL': false }, { lean: true })
        try {
            // Si avant c'est déjà désactivé on ne fait rien
            if (!position) return
            const orders = await this.orderService.findAll({ userId, symbol, terminated: false, activated: true })
            const stopLossList = await this.stopLossService.findAll({
                orderParentId: { $in: orders.map((o) => o._id) },
            })
            const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', symbol)
            const stopLossListToUpdate: StopLoss[] = []
            // update all SL to minimum
            for (const stopLoss of stopLossList) {
                const orderIndex = orders.findIndex((o) => o._id.equals(stopLoss.orderParentId))
                const order = orders[orderIndex]
                const triggerPrice = await this.orderService.getSLTriggerCurrentFromOrder(order)
                const quantity = await this.orderService.getQuantityAvailable(stopLoss.orderParentId, order)
                if (stopLoss.terminated) {
                    stopLossListToUpdate.push(stopLoss)
                } else if (stopLoss.quantity !== quantity || triggerPrice !== stopLoss.triggerPrice) {
                    const params = {
                        orderId: stopLoss.orderId,
                        clientOid: stopLoss.clOrderId.toString(),
                        marginCoin: stopLoss.marginCoin,
                        productType: BitgetService.PRODUCT_TYPEV2,
                        symbol: this.bitgetUtilsService.convertSymbolToV2(stopLoss.symbol),
                        planType: 'loss_plan',
                        triggerPrice: stopLoss.triggerPrice.toString(),
                        triggerType: 'fill_market',
                        executePrice: stopLoss.triggerPrice.toString(),
                        size: symbolRules.minTradeNum,
                    }
                    await this.stopLossService.deleteOne(stopLoss._id)
                    await clientV2.futuresCancelPlanOrder(params).catch((e) => {
                        this.errorTraceService.createErrorTrace('recreateAllSL > delete SL', userId, ErrorTraceSeverity.IMMEDIATE, {
                            userId,
                            symbol,
                            stopLoss,
                            error: e,
                        })
                    })
                    stopLossListToUpdate.push(stopLoss)
                }
            }
            await this.positionService.findOneAndUpdate({ userId, symbol: symbolV2 }, { 'synchroExchange.SL': true })
            // update all SL to size
            for (const stopLoss of stopLossListToUpdate) {
                const order = orders.find((o) => o._id.equals(stopLoss.orderParentId))
                await this.activeSL(BitgetService.getClient(order.userId), order)
            }
        } catch (e) {
            this.errorTraceService.createErrorTrace('recreateAllSL', userId, ErrorTraceSeverity.IMMEDIATE, {
                userId,
                symbol,
                error: e,
            })
        } finally {
            // security
            await this.positionService.findOneAndUpdate({ userId, symbol: symbolV2 }, { 'synchroExchange.SL': true })
        }
    }
}
