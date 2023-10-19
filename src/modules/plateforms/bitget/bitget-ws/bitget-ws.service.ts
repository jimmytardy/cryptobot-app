import {
    Injectable,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { WebsocketClient } from 'bitget-api'
import { Model, Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { BitgetActionService } from '../bitget-action/bitget-action.service'
import { BitgetService } from '../bitget.service'
import { ConfigService } from '@nestjs/config'
import { TakeProfit } from 'src/model/TakeProfit'
import { OrderService } from 'src/modules/order/order.service'
import { UserService } from 'src/modules/user/user.service'
import { User } from 'src/model/User'

@Injectable()
export class BitgetWsService {
    client: {
        [key: string]: WebsocketClient
    }
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(TakeProfit.name) private takeProfitModel: Model<TakeProfit>,
        private orderService: OrderService,
        private bitgetService: BitgetService
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
        this.activateWebSocket(user._id)
    }

    async initializeTraders(users: User[]) {
        for (const user of users) {
            this.addNewTrader(user);
        }
    }

    activateWebSocket(userId: Types.ObjectId) {
        const userIdStr = userId.toString()
        // client.subscribeTopic('UMCBL', 'ordersAlgo');
        this.client[userIdStr].subscribeTopic('UMCBL', 'orders')
        this.client[userIdStr].on('update', (e) =>
            this.onUpdatedOrder(e, userId),
        )
    }

    private async onUpdatedOrder(e: any, userId: Types.ObjectId) {
        const data = e.data

        for (const order of data) {
            switch (order.status) {
                case 'full-fill':
                    if (order.side === 'buy') {
                        await this.bitgetService.activeOrder(order.ordId, userId)
                    } else if (order.side === 'sell') {
                        // close take profit
                        const takeProfit = await this.takeProfitModel.findOne({
                            orderId: order.clOrdId,
                            terminated: { $ne: true },
                            userId
                        })
                        if (!takeProfit) break;
                        takeProfit.terminated = true
                        await takeProfit.save()

                        // upgrade SL
                        const orderConfig = await this.orderModel.findOne({
                            _id: takeProfit.orderParentId,
                            userId
                        })

                        if (takeProfit.num === orderConfig.TPs.length) {
                            orderConfig.terminated = true
                            await orderConfig.save()
                        } else {
                            const stopLoss =
                                await this.bitgetService.upgradeSL(orderConfig)
                            // disabled other order that not actived
                            if (stopLoss.step === 0) {
                                await this.orderModel.updateMany(
                                    {
                                        linkOrderId: orderConfig.linkOrderId,
                                        terminated: { $ne: true },
                                        activated: false,
                                        userId
                                    },
                                    { terminated: true },
                                )
                            }
                        }
                    } else {
                        console.log('order.side', order.side)
                    }
                    break
                case 'partial-fill':
                    // stop loss activate
                    if (order.side === 'sell') {
                        const takeProfit = await this.takeProfitModel.findOne({
                            orderId: order.ordId,
                            terminated: { $ne: true },
                        })
                        if (!takeProfit) break
                        takeProfit.terminated = true
                        await takeProfit.save()
                        const numTakeProfitActivate =
                            await this.takeProfitModel.countDocuments({
                                orderParentId: takeProfit.orderParentId,
                                terminated: { $ne: true },
                            })
                        if (numTakeProfitActivate === 0) {
                            await this.orderModel.updateOne(
                                { orderId: takeProfit.orderParentId },
                                { terminated: true },
                            )
                        }
                    }
                    break
                case 'new':
                    if (order.side === 'sell') {
                        const orderConfig = await this.orderModel.exists({
                            orderId: order.ordId,
                        })
                        if (!orderConfig) break
                        await this.orderService.disableOrder(order.ordId)
                    }
                default:
                    break
            }
        }
    }
}
