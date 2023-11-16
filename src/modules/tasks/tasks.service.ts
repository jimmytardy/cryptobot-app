import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PaymentsService } from '../payment/payments.service'
import { InjectModel } from '@nestjs/mongoose'
import { Order } from 'src/model/Order'
import { Model } from 'mongoose'
import { BitgetUtilsService } from '../plateforms/bitget/bitget-utils/bitget-utils.service'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import { FuturesKlineInterval, FuturesSymbolRule } from 'bitget-api'
import { BitgetActionService } from '../plateforms/bitget/bitget-action/bitget-action.service'

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService,
        private bitgetService: BitgetService,
    ) {}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async sendPlateformsOrders() {
        try {
            const ordersToSend = await this.orderModel
                .find({
                    sendToPlateform: { $ne: true },
                    terminated: false,
                    activated: false,
                })
                .lean()
                .exec()

            if (ordersToSend.length === 0) {
                return
            }
            this.logger.log(
                'Ordre en attente de placement:',
                ordersToSend.length,
            )
            const rules: {
                [key: string]: { symbolRules: FuturesSymbolRule; price: number }
            } = {}
            for (const order of ordersToSend) {
                const client = this.bitgetService.getFirstClient()
                if (!rules[order.symbol]) {
                    const [symbolRules, price] = await Promise.all([
                        this.bitgetUtilsService.getSymbolBy(
                            client,
                            'symbol',
                            order.symbol,
                        ),
                        this.bitgetUtilsService.getCurrentPrice(
                            client,
                            order.symbol,
                        ),
                    ])
                    rules[order.symbol] = {
                        symbolRules,
                        price,
                    }
                }

                const sendtoBitget = this.bitgetUtilsService.canSendBitget(
                    rules[order.symbol].symbolRules,
                    rules[order.symbol].price,
                    order,
                )
                if (sendtoBitget) {
                    try {
                        await this.bitgetActionService.placeOrderBitget(
                            client,
                            order,
                        )
                    } catch (e) {
                        if (e.body.code === '40786') {
                            const orderBitget = await client.getOrder(
                                order.symbol,
                                order.orderId,
                                order.clOrderId
                                    ? String(order.clOrderId)
                                    : undefined,
                            )
                            if (orderBitget.data) {
                                await this.orderModel.updateOne(
                                    { _id: order._id },
                                    {
                                        $set: {
                                            orderId: orderBitget.data.orderId,
                                            sendToPlateform: true,
                                            activated: true,
                                            terminated:
                                                orderBitget.data.status ===
                                                'filled',
                                        },
                                    },
                                )
                                console.info(
                                    "Mise à jour de l'ordre",
                                    orderBitget,
                                )
                            } else {
                                console.error(
                                    "L'ordre n'a pas été trouvé",
                                    order,
                                )
                                await this.orderModel.updateOne(
                                    { _id: order._id },
                                    {
                                        $set: {
                                            terminated: true,
                                        },
                                    },
                                )
                            }
                        }
                        console.error('sendPlateformsOrders', e, order)
                    }
                }
            }
        } catch (e) {
            this.logger.error('sendPlateformsOrders', e)
            console.error('e', e.stack)
            console.trace()
        }
    }

    /**
     * Supprime les ordres qui ne sont pas activés mais qui ont déjà taper un TP
     */
    @Cron(CronExpression.EVERY_10_SECONDS)
    async cleanOrderNotTriggeredWhichTP() {
        try {
            const ordersToSend = await this.orderModel
                .find({
                    terminated: false,
                    activated: false,
                })
                .lean()
                .exec();

            const symbolData = {}
            
            const querys = [];
            const timestampNow = Date.now();
            const candlesToFetch = 1;
            const nbMin = 15;
            const msPerCandle = 60 * 1000 * nbMin; // 60 seconds x 1000 X nbMin
            const msFor1kCandles = candlesToFetch * msPerCandle;
            const startTime = timestampNow - msFor1kCandles;
            for (const order of ordersToSend) {
                if (!symbolData[order.symbol]) {
                    const client = this.bitgetService.getFirstClient(); 
                    const candles = await client.getCandles(order.symbol, nbMin + 'm' as FuturesKlineInterval, startTime.toString(), timestampNow.toString(), String(candlesToFetch));
                    if (candles && (candles.length <= 0 || candles[0].length < 4)) continue;
                    symbolData[order.symbol] = {
                        max: parseFloat(candles[0][2]), // Highest price
                        min: parseFloat(candles[0][3]) // Lowest price
                    }
                }
                const createdAt = new Date(order.createdAt).getTime();
                // if order is older than nbMin minutes, continue
                if ((createdAt - timestampNow) / 1000 / 60 > nbMin) continue;
                if ((order.side === 'long' && symbolData[order.symbol].max >= order.TPs[0]) || (order.side === 'short' && symbolData[order.symbol].min <= order.TPs[0])) {
                    querys.push(this.orderModel.updateOne({ _id: order._id }, { $set: { terminated: true } }))
                }
            }
            await Promise.all(querys);
        } catch (e) {
            this.logger.error('disableOrderNotSendWhichTP', e)
            console.error('e', e.stack)
            console.trace()
        }
    }
}
