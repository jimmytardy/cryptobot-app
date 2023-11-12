import { Injectable } from '@nestjs/common'
import { OrderBotService } from '../order-bot/order-bot.service'
import { OrderBot } from 'src/model/OrderBot'

@Injectable()
export class TelegramService /*implements OnApplicationBootstrap*/ {
    constructor(private orderBotService: OrderBotService) {}

    async webhook(body: any) {
        switch (body.type) {
            case 'old_message':
                await Promise.all(body.messages.map(this.processingMessage))
            case 'new_message':
                await this.processingMessage(body.message);
                break
        }
    }

    async processingMessage(message: { id: string; text: string }) {
        const order: OrderBot = this.orderBotService.orderBotFromText(
            message.text,
        )
        if (order) {
            order.messageId = message.id
            await this.orderBotService.placeOrderBot(order)
        }
    }
}
