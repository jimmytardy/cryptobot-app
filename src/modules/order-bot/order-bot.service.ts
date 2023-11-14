import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { OrderBot } from 'src/model/OrderBot'
import { PaymentsService } from '../payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { BitgetService } from '../plateforms/bitget/bitget.service'

@Injectable()
export class OrderBotService {
    logger: Logger = new Logger('OrderBotService')
    constructor(
        @InjectModel(OrderBot.name) private orderBotModel: Model<OrderBot>,
        private paymentService: PaymentsService,
        private bitgetService: BitgetService,
    ) {}

    orderBotFromText(message: string): OrderBot | null {
        const lines = (message || '')
            .replaceAll(/🟢|🔴|🔰|🎯|📛/g, '')
            .split('\n')
            .filter((line) => line.length > 0)
        if (lines.length < 6) return null
        const orderBot = new OrderBot()
        // get baseCoin and side
        let regex = /(.*?)\s*\((LONG|SHORT)\)/
        let match = lines[0].match(regex)
        if (match) {
            orderBot.baseCoin = match[1].trim()
            orderBot.side = match[2].toLocaleLowerCase() as 'long' | 'short'
        } else return null
        // get  entry price
        regex = /(\d+)-(\d+)/
        const lineTab = lines[1].split(':')
        if (!lineTab[1]) return null
        const numbersPE = lineTab[1].split('-')
        if (numbersPE.length > 0) {
            orderBot.PEs = numbersPE
                .map((num) => parseFloat((num || '').replaceAll(',', '.')))
                .filter((pe) => !isNaN(pe))
        } else return null
        orderBot.TPs = []
        let i = 2
        for (i; i < lines.length; i++) {
            const line = lines[i]
            if (line.includes('TP')) continue
            if (line.includes('SL')) break
            orderBot.TPs.push(parseFloat(line.trim().replaceAll(',', '.')))
        }
        orderBot.TPs = orderBot.TPs.filter((tp) => !isNaN(tp))
        // get stop loss
        orderBot.SL = parseFloat(
            lines[i].split(':')[1].replaceAll(',', '.').trim(),
        )
        return orderBot
    }

    async placeOrderBot(orderBot: OrderBot) {
        try {
            const orderExist = await this.orderBotModel.findOne({
                messageId: orderBot.messageId,
            })
            if (orderExist) {
                this.logger.debug(
                    `OrderBot with messageId ${orderBot.messageId} already exist`,
                )
                return null
            }

            if (!orderBot.linkOrderId)
                orderBot.linkOrderId = new Types.ObjectId()

            const newOrderBot = new this.orderBotModel(orderBot)
            // await newOrderBot.save()

            const [users1, users2] = await Promise.all([
                await this.paymentService.getUsersSubscription(
                    SubscriptionEnum.LIGHTBOT,
                ),
                await this.paymentService.getUsersSubscription(
                    SubscriptionEnum.BOT,
                ),
            ])
            return await Promise.all(
                users1
                    .concat(users2)
                    .map(
                        async (user) =>
                            await this.bitgetService
                                .placeOrder(
                                    orderBot,
                                    user,
                                    newOrderBot.linkOrderId,
                                )
                                .catch((error) => {
                                    this.logger.error(user._id, error)
                                    return error
                                }),
                    )
                    .concat(),
            )
        } catch (e) {
            this.logger.error(e)
            return e
        }
    }
}
