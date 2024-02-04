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

@Injectable()
export class BitgetFuturesService {
    logger: Logger = new Logger('BitgetFuturesService')
    constructor(
        private bitgetUtilsService: BitgetUtilsService,
        private orderService: OrderService,
        private stopLossService: StopLossService,
        private takeProfitService: TakeProfitService,
        private errorTraceService: ErrorTraceService,
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

    async activeOrder(client: FuturesClient, orderId: Types.ObjectId, user: User, orderBitget: any) {
        try {
            const quantity = parseFloat(orderBitget.fillSz || orderBitget.sz)
            const PE = parseFloat(orderBitget.fillPx || orderBitget.px)
            const leverage = parseFloat(orderBitget.lever)
            const order = await this.orderService.getOrderForActivation(orderId, { PE, quantity, leverage })
            if (!order || order.activated) return null
            const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
            if (!symbolRules) throw new Error('Symbol not found')
            // important for active TPs
            order.activated = true
            await this.activeSL(client, order)
            await this.activeTPs(client, user.preferences.order.TPSize, symbolRules, order)
            order.inActivation = false
            await this.orderService.updateOne(order)
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
            const clientOid = new Types.ObjectId()
            const params: NewFuturesPlanStopOrder = {
                symbol: order.symbol,
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
            await this.stopLossService.createFromOrder(order, clientOid, orderId)
        } catch (e) {
            this.errorTraceService.createErrorTrace('activeSL', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                totalQuantity,
                error: e,
            })
        }
    }

    async cancelTakeProfit(client: FuturesClient, takeProfit: TakeProfit, deleteTakeProfit = false) {
        try {
            if (takeProfit.activated && !takeProfit.terminated) {
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
            this.errorTraceService.createErrorTrace('deleteTakeProfit', takeProfit.userId, ErrorTraceSeverity.ERROR, {
                takeProfit,
                error: e,
            })
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

    async upgradeStopLoss(client: FuturesClient, order: Order, strategy: IOrderStrategy, numTP: number): Promise<StopLoss> {
        const stopLoss = await this.stopLossService.findOne(
            {
                orderParentId: order._id,
                terminated: { $ne: true },
            },
            undefined,
            { lean: true },
        )
        try {
            if (!stopLoss) {
                return
            }

            let newStep = this.stopLossService.getNewStep(numTP, strategy)
            const triggerPrice = await this.orderService.getSLTriggerFromStep(order, newStep)

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
                stopLoss.historyTrigger = [...stopLoss.historyTrigger, stopLoss.triggerPrice]
                stopLoss.triggerPrice = triggerPrice
            }
            stopLoss.step = newStep
            return await this.stopLossService.updateOne(stopLoss, { new: true })
        } catch (e) {
            this.errorTraceService.createErrorTrace('upgradeSL', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                order,
                strategy,
                numTP,
                stopLoss,
                error: e,
            })
        }
    }

    async updateStopLoss(client: FuturesClient, order: Order, newSL: number): Promise<boolean> {
        try {
            if (order.sendToPlateform && order.activated) {
                const stopLoss: StopLoss = await this.stopLossService.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (!stopLoss) {
                    order.SL = newSL
                    await this.activeSL(client, order)
                } else if (order.SL !== newSL) {
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
                        await this.stopLossService.updateOne(stopLoss, { new: true })
                    } catch (e) {
                        this.errorTraceService.createErrorTrace('updateOrderSL', order.userId, ErrorTraceSeverity.IMMEDIATE, {
                            order,
                            newSL,
                            stopLoss,
                            params: paramsSL,
                            error: e,
                        })
                        return false
                    }
                }
            }
            order.SL = newSL
            await this.orderService.updateOne(order)
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

    async updateTakeProfit(client: FuturesClient, order: Order, newTP: number, takeProfit: TakeProfit): Promise<void> {
        try {
            if (order.sendToPlateform && order.activated && takeProfit && takeProfit.triggerPrice !== newTP && !takeProfit.terminated) {
                const oldTP = takeProfit.triggerPrice
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
                await this.takeProfitService.updateOne(takeProfit)
                const SL = await this.stopLossService.findOne({
                    orderParentId: order._id,
                    terminated: false,
                })
                if (SL.triggerPrice === oldTP) {
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
                    await this.stopLossService.updateOne(SL)
                }
            }
        } catch (e) {
            this.errorTraceService.createErrorTrace('updateTakeProfit', order.userId, ErrorTraceSeverity.ERROR, {
                order,
                newTP,
                takeProfit,
                error: e,
            })
        }
    }

    async updateTakeProfits(client: FuturesClient, order: Order, newTPs: number[], TPSize: TPSizeType): Promise<boolean> {
        try {
            const symbolRules = await this.bitgetUtilsService.getSymbolBy('symbol', order.symbol)
            if (order.sendToPlateform && order.activated) {
                const takeProfits = await this.takeProfitService.findAll(
                    {
                        orderParentId: order._id,
                    },
                    undefined,
                    { sort: { num: order.side === 'long' ? 1 : -1 }, lean: true },
                )

                const totalQuantity = await this.orderService.getQuantityAvailable(order._id, order)
                const TPList = [...newTPs]
                const takeProfitNotTerminated = []
                for (let i = 0; i < takeProfits.length; i++) {
                    if (takeProfits[i].terminated) {
                        TPList.splice(takeProfits[i].num - 1, 1)
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

                if (newTPPricesCalculate.length !== order.TPs.length) {
                    // En premier on supprime tout les TPs
                    await Promise.all(
                        takeProfitNotTerminated.map(async (takeProfit) => {
                            await this.cancelTakeProfit(client, takeProfit, true)
                        }),
                    )
                    // Enfin on ajoute les nouveaux trades
                    for (let i = 0; i < newTPPricesCalculate.length; i++) {
                        const newSize = newTPSizeCalculate[i]
                        await this.addTakeProfit(client, order, newTPPricesCalculate[i], takeProfitNotTerminated[i].num, newSize)
                    }
                } else {
                    for (let i = 0; i < takeProfitNotTerminated.length; i++) {
                        const takeProfit = takeProfitNotTerminated[i]
                        const newTP = newTPPricesCalculate[i]
                        if (newTP !== takeProfit.triggerPrice) {
                            await this.updateTakeProfit(client, order, newTP, takeProfit)
                        }
                    }
                }

                order.TPs = newTPPricesCalculate
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

    async cancelOrder(client: FuturesClient, order: Order) {
        try {
            if (!order.terminated) {
                try {
                    if (order.sendToPlateform && order.orderId) {
                        if (!order.activated) {
                            await client.cancelOrder(order.symbol, order.marginCoin, undefined, order.clOrderId?.toString())
                        } else {
                            // cancel exact quantity of order => when is possibility with SDK + cancel all TP and SL
                            // TODO
                        }
                    }
                } catch (e) {
                    let traceSeverity: ErrorTraceSeverity = ErrorTraceSeverity.IMMEDIATE
                    if (e.body.code !== '40768') {
                        // order not exists
                        traceSeverity = ErrorTraceSeverity.ERROR
                    }
                    this.errorTraceService.createErrorTrace('cancelOrder > Order not exists', order.userId, traceSeverity, {
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

    async disabledOrderLink(client: FuturesClient, linkId: Types.ObjectId, userId: Types.ObjectId) {
        const orders = await this.orderService.findAll({
            linkOrderId: linkId,
            terminated: false,
            activated: false,
            userId,
        })
        await Promise.all(
            orders.map(async (order) => {
                await this.cancelOrder(client, order)
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
}
