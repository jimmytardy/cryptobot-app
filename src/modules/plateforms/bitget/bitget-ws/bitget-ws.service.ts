import {
    Injectable,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { WebsocketClient } from 'bitget-api'
import { Model, Types } from 'mongoose'
import { Order, OrderDocument } from 'src/model/Order'
import { BitgetActionService } from '../bitget-action/bitget-action.service'
import { BitgetService } from '../bitget.service'
import { ConfigService } from '@nestjs/config'
import { TakeProfit, TakeProfitDocument } from 'src/model/TakeProfit'
import { OrderService } from 'src/modules/order/order.service'
import { UserService } from 'src/modules/user/user.service'
import { User } from 'src/model/User'
import { StopLoss, StopLossDocument } from 'src/model/StopLoss'

@Injectable()
export class BitgetWsService {
    client: {
        [key: string]: WebsocketClient
    }
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>,
        @InjectModel(TakeProfit.name)
        private takeProfitModel: Model<TakeProfit>,
        private orderService: OrderService,
        private bitgetService: BitgetService,
    ) {
        this.client = {}
    }

    addNewTrader(user: User) {
        const userId = user._id.toString()
        this.client[userId] = new WebsocketClient({
            apiKey: user.bitget.api_key,
            apiPass: user.bitget.api_pass,
            apiSecret: user.bitget.api_secret_key,
        })
        this.activateWebSocket(user)
    }

    async initializeTraders(users: User[]) {
        for (const user of users) {
            this.addNewTrader(user)
        }
    }

    activateWebSocket(user: User) {
        const userIdStr = user._id.toString()
        // client.subscribeTopic('UMCBL', 'ordersAlgo');
        this.client[userIdStr].subscribeTopic('UMCBL', 'orders')
        this.client[userIdStr].subscribeTopic('UMCBL', 'ordersAlgo')
        this.client[userIdStr].on('update', async (e) => {
            switch (e.arg.channel) {
                case 'orders':
                    await this.onUpdatedOrder(e, user)
                    break
                case 'ordersAlgo':
                    await this.onUpdatedOrderAlgo(e, user)
                    break
                default:
                    console.info('topic not implemented', e)
            }
        })
    }

    private async onUpdatedOrderAlgo(e: any, user: User) {
        const data = e.data
        for (const orderAlgoEvent of data) {
            if (!Types.ObjectId.isValid(orderAlgoEvent.cOid)) return;
            const clOrderId = new Types.ObjectId(orderAlgoEvent.cOid);
            console.log('orderAlgoEvent.cOid', orderAlgoEvent.cOid)
            const takeProfit = await this.takeProfitModel.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            });
            console.log('takeProfit', takeProfit);
            if (takeProfit) {
                return await this.onUpdatedOrderAlgoTP(orderAlgoEvent, takeProfit);
            }
                

            const stopLoss = await this.stopLossModel.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            })

            if (stopLoss) {
                return await this.onUpdatedOrderAlgoSL(orderAlgoEvent, stopLoss);
            }
        }
    }

    private async onUpdatedOrderAlgoSL(
        orderAlgoEvent: any,
        stopLoss: StopLossDocument,
    ) {
        switch (orderAlgoEvent.state) {
            case 'cancel':
                stopLoss.terminated = true;
                stopLoss.cancelled = true;
                await stopLoss.save();
                break;
            case 'not_trigger':
                if (stopLoss.triggerPrice !== Number(orderAlgoEvent.triggerPx)) {
                    stopLoss.triggerPrice = Number(orderAlgoEvent.triggerPx);
                    stopLoss.updated = true;
                    await stopLoss.save();
                }
                break;
            case 'triggered':
                await this.onStopLossTriggered(stopLoss);
                break;
            default:
                console.info(
                    'onUpdatedOrderAlgoSL',
                    orderAlgoEvent.status,
                    'not implemented',
                )
        }
    }

    private async onUpdatedOrderAlgoTP(
        orderAlgoEvent: any,
        takeProfit: TakeProfitDocument,
    ) {
        switch (orderAlgoEvent.state) {
            case 'cancel':
                takeProfit.terminated = true;
                takeProfit.cancelled = true;
                await takeProfit.save();
                const takesProfitsNotTerminated = await this.takeProfitModel.countDocuments({
                    orderParentId: takeProfit.orderParentId,
                    terminated: { $ne: true },
                });
                if (takesProfitsNotTerminated === 0) {
                    await this.orderService.cancelOrder(takeProfit.orderParentId);
                }
                break;
            case 'not_trigger':
                if (takeProfit.triggerPrice !== Number(orderAlgoEvent.triggerPx)) {
                    takeProfit.triggerPrice = Number(orderAlgoEvent.triggerPx);
                    takeProfit.updated = true;
                    await takeProfit.save();
                }
                break;
            case 'triggered':
                await this.onTakeProfitTriggered(takeProfit);
                break;
            default:
                console.info(
                    'onUpdatedOrderAlgoTP',
                    orderAlgoEvent.status,
                    'not implemented',
                )
        }
    }

    private async onUpdatedOrder(e: any, user: User) {
        const data = e.data

        for (const orderEvent of data) {
            if (orderEvent.status === 'new') return
            if (!Types.ObjectId.isValid(orderEvent.clOrdId)) return
            const clOrderId = new Types.ObjectId(orderEvent.clOrdId)
            const order = await this.orderModel.findOne({
                clOrderId,
                terminated: { $ne: true },
                userId: user._id,
            })
            if (order) return this.onOrderEvent(orderEvent, user, order);
        }
    }

    private async onOrderEvent(orderEvent: any, user: User, order: OrderDocument) {
        switch (orderEvent.status) {
            case 'full-fill':
            case 'partial-fill':
                if (orderEvent.side === 'buy') {
                    await this.bitgetService.activeOrder(
                        orderEvent.ordId,
                        user,
                    )
                    break
                }
            case 'cancelled':
                await this.orderService.cancelOrder(order._id)
                break
            default:
                console.info('onOrderEvent', orderEvent, 'not implemented')
        }
    }

    private async onTakeProfitTriggered(takeProfit: TakeProfitDocument) {
        takeProfit.terminated = true;
        takeProfit.activated = true;
        await takeProfit.save()
        const order = await this.orderModel.findById(takeProfit.orderParentId);
        // close order if has take all TPs
        try {
            // upgrade stop loss
            const stopLoss = await this.bitgetService.upgradeSL(order);
            // cancel other order that not actived
            if (stopLoss.step >= 0) {
                await this.bitgetService.disabledOrderLink(
                    order.userId,
                    order.linkOrderId,
                )
            }
        } catch (e) {
            console.error('onTakeProfitTriggered', order, e)
        }
    }

    private async onStopLossTriggered(stopLoss: StopLossDocument) {
        stopLoss.terminated = true;
        stopLoss.activated = true;
        await stopLoss.save();
        const order = await this.orderModel.findOne({
            _id: stopLoss.orderParentId,
            userId: stopLoss.userId,
        })
        await this.orderService.cancelOrder(order._id)
    }
}
