import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PaymentsService } from '../payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { InjectModel } from '@nestjs/mongoose'
import { Order } from 'src/model/Order'
import { Model } from 'mongoose'
import { BitgetUtilsService } from '../plateforms/bitget/bitget-utils/bitget-utils.service'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import { FuturesClient, FuturesSymbolRule } from 'bitget-api'
import { BitgetActionService } from '../plateforms/bitget/bitget-action/bitget-action.service'

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        private paymentService: PaymentsService,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        private bitgetUtilsService: BitgetUtilsService,
        private bitgetActionService: BitgetActionService,
        private bitgetService: BitgetService,
    ) {}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async sendPlateformsOrders() {
        const ordersToSend = await this.orderModel
            .find({
                sendToPlateform: false,
                terminated: false,
                activated: false,
            })
            .exec()
        const rules: {
            [key: string]: { symbolRules: FuturesSymbolRule; price: number }
        } = {}
        for (const order of ordersToSend) {
            const client = this.bitgetService.getClient(order.userId)
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
                order
            )
            if (sendtoBitget) {
                await this.bitgetActionService.placeOrderBitget(client, order)
            }
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async checkOrdersNotActivated() {

    }
}
