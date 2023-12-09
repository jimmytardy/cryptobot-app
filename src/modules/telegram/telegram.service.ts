import { Injectable, Logger } from '@nestjs/common'
import { OrderBotService } from '../order-bot/order-bot.service'
import { OrderBot } from 'src/model/OrderBot'
import { Order } from 'src/model/Order'

@Injectable()
export class TelegramService {
    logger = new Logger(TelegramService.name)
    constructor(private orderBotService: OrderBotService) {}

    async webhook(body: any) {
        switch (body.type) {
            case 'old_message':
                // (message) => this.processingNewMessage(message) is necessary for thier.orderBotService in this function
                return await Promise.all(
                    body.messages
                        .filter((m) => m.id && m.text)
                        .map((message) => this.processingNewMessage(message)),
                )
            case 'update_message':
                return await this.processingUpdateMessage(body.message)
            case 'new_message':
                return await this.processingNewMessage(body.message)
            case 'delete_message':
                return await this.processingDeleteMessage(body.message)
        }
    }

    async processingNewMessage(message: { id: string; text: string, reply_to_msg_id: string }) {
        if (!message) return 'Le message est vide';
        if (message.text.split('\n')[0].trim().toLowerCase().includes('prenable') && message.reply_to_msg_id) {
            const orderBot = await this.orderBotService.findByMessageId(message.reply_to_msg_id);
            if (orderBot) {
                return await this.orderBotService.rePlaceOrderBot(orderBot)
            }
        }
        const order: OrderBot = this.orderBotService.orderBotFromText(
            message.text,
        )
        if (order) {
            order.messageId = message.id
            return await this.orderBotService.createOrderBot(order)
        }
    }

    async processingUpdateMessage(message: { id: string; text: string }) {
        if (!message) return 'Le message est vide';
        const orderUpdated: OrderBot = this.orderBotService.orderBotFromText(
            message.text,
        )
        if (orderUpdated) {
            orderUpdated.messageId = message.id;
            const orderBot = await this.orderBotService.findByMessageId(message.id, '_id');
            if (orderBot) {
                return await this.orderBotService.setOrder(orderBot._id, {
                    PEs: orderUpdated.PEs,
                    TPs: orderUpdated.TPs,
                    SL: orderUpdated.SL,
                });
            }
        } else {
            return await this.processingDeleteMessage(message);
        }
    }

    async processingDeleteMessage(message: { id: string }) {
        if (!message) return 'Le message est vide';
        const orderBot = await this.orderBotService.findByMessageId(message.id, '_id');
        if (orderBot) {
            return await this.orderBotService.deleteOrderBot(orderBot._id);
        }
    }
}
