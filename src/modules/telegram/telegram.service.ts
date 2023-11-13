import { Injectable } from '@nestjs/common'
import { OrderBotService } from '../order-bot/order-bot.service'
import { OrderBot } from 'src/model/OrderBot'

@Injectable()
export class TelegramService /*implements OnApplicationBootstrap*/ {
    constructor(private orderBotService: OrderBotService) {}

    async webhook(body: any) {
        switch (body.type) {
            case 'old_message':
                // (message) => this.processingMessage(message) is necessary for thier.orderBotService in this function
                await Promise.all(body.messages.filter(m => m.id && m.text).map((message) => this.processingMessage(message)))
            case 'new_message':
                console.log('body.message', body.message)
                await this.processingMessage(body.message);
                break
        }
    }

    async processingMessage(message: { id: string; text: string }) {
        if (!message) return
        const order: OrderBot = this.orderBotService.orderBotFromText(
            message.text,
        )
        if (order) {
            order.messageId = message.id
            await this.orderBotService.placeOrderBot(order)
        }
    }
}
