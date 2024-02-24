import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { WebsocketClient, WebsocketClientV2 } from 'bitget-api'
import { Model, Types } from 'mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { BitgetService } from '../bitget.service'
import { TakeProfit, TakeProfitDocument } from 'src/model/TakeProfit'
import { OrderService } from 'src/modules/order/order.service'
import { User } from 'src/model/User'
import { StopLoss, StopLossDocument } from 'src/model/StopLoss'
import { IOrderAlgoEventData, IOrderEventData } from './bitget-ws.interface'
import { StopLossService } from 'src/modules/order/stop-loss/stop-loss.service'
import { TakeProfitService } from 'src/modules/order/take-profit/take-profit.service'
import { UserService } from 'src/modules/user/user.service'
import { UtilService } from 'src/util/util.service'
import { PositionService } from 'src/modules/position/position.service'
import { ErrorTraceService } from 'src/modules/error-trace/error-trace.service'
import { ErrorTraceSeverity } from 'src/model/ErrorTrace'

@Injectable()
export class BitgetWsService {
    client: {
        [key: string]: WebsocketClientV2
    }
    logger: Logger = new Logger('BitgetWsService')
    constructor(
        private orderService: OrderService,
        private bitgetService: BitgetService,
        private stopLossService: StopLossService,
        private takeProfitService: TakeProfitService,
        private positionService: PositionService,
        private userService: UserService,
        private erroTraceService: ErrorTraceService
    ) {
        this.client = {}
    }

    loggerTrace(logger: Logger, type: 'log' | 'fatal' | 'error' | 'verbose' | 'warn' | 'debug', userId: string) {
        return (...params: any[]) => logger[type](params.map((p) => (typeof p === 'object' ? JSON.stringify(p) : p)).join(' '))
    }

    addNewTrader(user: User) {
        const userId = user._id.toString()
        const logger: Logger = new Logger('BitgetWS-' + user._id)
        if (!this.client[userId]) {
            this.client[userId] = new WebsocketClientV2(
                {
                    apiKey: user.bitget.api_key,
                    apiPass: user.bitget.api_pass,
                    apiSecret: user.bitget.api_secret_key,
                },
                {
                    debug: this.loggerTrace(logger, 'debug', userId),
                    error: this.loggerTrace(logger, 'error', userId),
                    info: this.loggerTrace(logger, 'log', userId),
                    notice: () => {
                        return
                    } /* this.loggerTrace(logger, 'verbose', userId) */,
                    silly: () => {
                        return
                    } /* this.loggerTrace(logger, 'verbose', userId) */,
                    warning: this.loggerTrace(logger, 'warn', userId),
                },
            )
            this.activateWebSocket(user)
        }
    }

    removeTrader(user: User) {
        const userId = user._id.toString()
        if (this.client[userId]) {
            this.desactivateWebSocket(user)
            delete this.client[userId]
        }
    }

    desactivateWebSocket(user: User) {
        const userIdStr = user._id.toString()
        if (this.client[userIdStr]) {
            this.client[userIdStr].unsubscribeTopic(BitgetService.PRODUCT_TYPEV2, 'orders')
            this.client[userIdStr].unsubscribeTopic(BitgetService.PRODUCT_TYPEV2, 'orders-algo')
        }
    }

    activateWebSocket(user: User) {
        const userIdStr = user._id.toString()
        // client.subscribeTopic('UMCBL', 'ordersAlgo');
        this.client[userIdStr].subscribeTopic(BitgetService.PRODUCT_TYPEV2, 'orders')
        this.client[userIdStr].subscribeTopic(BitgetService.PRODUCT_TYPEV2, 'orders-algo')
        this.client[userIdStr].on('update', async (e) => {
            const userCurrent = await this.userService.findById(user._id)
            switch (e.arg.channel) {
                case 'orders':
                    await this.onUpdatedOrder(e.data, userCurrent)
                    break
                case 'orders-algo':
                    await this.onUpdatedOrderAlgo(e.data, userCurrent)
                    break
                default:
                    console.info('topic not implemented', e)
            }
        })
    }

    private async onUpdatedOrderAlgo(data: IOrderAlgoEventData[], user: User) {
        // console.log('onUpdatedOrderAlgo', data[0].planType, data[0].status, data[0].clientOid)
        for (const orderAlgoEvent of data) {
            if (!Types.ObjectId.isValid(orderAlgoEvent.clientOid)) return
            const position = await this.positionService.findOneAndCreate({
                userId: user._id,
                symbol: orderAlgoEvent.instId,
            })
            const clOrderId = new Types.ObjectId(orderAlgoEvent.clientOid)

            const takeProfit = await this.takeProfitService.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            })
            if (takeProfit && position.synchroExchange.TP) {
                return await this.onUpdatedOrderAlgoTP(orderAlgoEvent, takeProfit)
            }
            const stopLoss = await this.stopLossService.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            })

            if (stopLoss && position.synchroExchange.SL) {
                return await this.onUpdatedOrderAlgoSL(orderAlgoEvent, stopLoss)
            }
        }
    }

    private async onUpdatedOrderAlgoSL(orderAlgoEvent: IOrderAlgoEventData, stopLoss: StopLoss) {
        try {
            switch (orderAlgoEvent.status) {
                case 'cancelled':
                    await this.stopLossService.cancel({ _id: stopLoss._id })
                    const quantityAvailable = await this.orderService.getQuantityAvailable(stopLoss.orderParentId)
                    if (quantityAvailable === 0) {
                        await this.orderService.cancelOrder(stopLoss.orderParentId)
                    } else {
                        await this.bitgetService.synchronizeAllSL(stopLoss.userId, stopLoss.symbol)
                    }
                    break
                case 'live':
                    const newSize = Number(orderAlgoEvent.size)
                    const newTriggerPrice = Number(orderAlgoEvent.triggerPrice)
                    // check if a good SL
                    if (newSize !== stopLoss.quantity || newTriggerPrice !== stopLoss.triggerPrice) {
                        stopLoss.quantity = Number(orderAlgoEvent.size)
                        stopLoss.triggerPrice = Number(orderAlgoEvent.triggerPrice)
                        await this.stopLossService.updateOne(stopLoss)
                        const quantityAvailable = await this.orderService.getQuantityAvailable(stopLoss.orderParentId)
                        // if we are multiple Order, reorganise all SL
                        if (quantityAvailable !== newSize) await this.bitgetService.synchronizeAllSL(stopLoss.userId, stopLoss.symbol)
                    }
                    break
                case 'executed':
                    await this.onStopLossTriggered(stopLoss)
                    break
                case 'executing':
                    break
                case 'fail_execute':
                    await this.bitgetService.synchronizeAllSL(stopLoss.userId, stopLoss.symbol)
                default:
                    console.info('onUpdatedOrderAlgoSL', orderAlgoEvent.status, 'not implemented')
            }
        } catch (e) {
            this.erroTraceService.createErrorTrace('onUpdateOrderAlgoSL', stopLoss.userId, ErrorTraceSeverity.IMMEDIATE, {
                error: e,
                orderAlgoEvent,
                stopLoss
            })
        }
    }

    private async onUpdatedOrderAlgoTP(orderAlgoEvent: IOrderAlgoEventData, takeProfit: TakeProfit) {
        try {
            switch (orderAlgoEvent.status) {
                case 'cancelled':
                    takeProfit.terminated = true
                    takeProfit.cancelled = true
                    await this.takeProfitService.updateOne(takeProfit)
                    const quantityAvailable = await this.orderService.getQuantityAvailable(takeProfit.orderParentId)
                    if (quantityAvailable === 0) {
                        await this.orderService.cancelOrder(takeProfit.orderParentId)
                    }
                    break
                case 'live':
                    takeProfit.quantity = Number(orderAlgoEvent.size)
                    takeProfit.triggerPrice = Number(orderAlgoEvent.triggerPrice)
                    await this.takeProfitService.updateOne(takeProfit)
                    break
                case 'executing':
                    break
                case 'executed':
                    await this.onTakeProfitTriggered(orderAlgoEvent, takeProfit);
                    break
                default:
                    console.info('onUpdatedOrderAlgoTP', orderAlgoEvent.status, 'not implemented')
            }
        } catch (e) {
            this.erroTraceService.createErrorTrace('onUpdatedOrderAlgoTP', takeProfit.userId, ErrorTraceSeverity.IMMEDIATE, {
                error: e,
                orderAlgoEvent,
                takeProfit
            })
        }
    }

    private async onUpdatedOrder(data: IOrderEventData[], user: User) {
        for (const orderEvent of data) {
            if (orderEvent.status === 'live') return
            if (!Types.ObjectId.isValid(orderEvent.clientOid)) return
            const clOrderId = new Types.ObjectId(orderEvent.clientOid)
            const position = await this.positionService.findOneAndCreate({
                userId: user._id,
                symbol: orderEvent.instId,
            })
            const order = await this.orderService.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            })
            if (order && position.synchroExchange.order) return this.onOrderEvent(orderEvent, user, order)
        }
    }

    private async onOrderEvent(orderEvent: IOrderEventData, user: User, order: Order) {
        switch (orderEvent.status) {
            case 'filled':
                if (
                    ((orderEvent.side === 'buy' && orderEvent.posSide === 'long') || (orderEvent.side === 'sell' && orderEvent.posSide === 'short')) &&
                    !order.activated &&
                    !order.inActivation
                ) {
                    await this.bitgetService.activeOrder(order._id, user, orderEvent)
                    break
                }
            case 'canceled':
                await this.orderService.cancelOrder(order._id)
                break
            case 'partially_filled':
                break;
            default:
                console.info('onOrderEvent', orderEvent.status, 'not implemented')
        }
    }

    private async onTakeProfitTriggered(orderAlgoEvent: IOrderAlgoEventData, takeProfit: TakeProfit) {
        takeProfit.triggerPrice = Number(orderAlgoEvent.triggerPrice)
        takeProfit.quantity = Number(orderAlgoEvent.size)
        takeProfit.terminated = true
        takeProfit.activated = true
        await this.takeProfitService.updateOne(takeProfit)
        const order = await this.orderService.findOne({ _id: takeProfit.orderParentId })
        const quantityAvailable = await this.orderService.getQuantityAvailable(takeProfit.orderParentId, order)
        // close order if has take all TPs
        try {
            const TPNotTrigger = await this.orderService.getTakeProfitNotTriggered(order._id)
            if (quantityAvailable === 0 || TPNotTrigger.length === 0) {
                await this.bitgetService.cancelOrder(order)
            } else {
                // cancel other order that not actived
                await this.bitgetService.disabledOrderLink(order.linkOrderId, order.userId)
                // upgrade stop loss
                // await this.bitgetService.upgradeSL(order, takeProfit.num)
            }
        } catch (e) {
            this.logger.error('onTakeProfitTriggered', order, e)
        }
    }

    private async onStopLossTriggered(stopLoss: StopLoss) {
        stopLoss.terminated = true
        stopLoss.activated = true
        await this.stopLossService.updateOne(stopLoss)
        await this.bitgetService.cancelTakeProfitsFromOrder(stopLoss.orderParentId, stopLoss.userId, null, false, true)
        await this.orderService.cancelOrder(stopLoss.orderParentId)
    }
}
