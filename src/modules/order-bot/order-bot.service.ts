import { HttpException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { OrderBot } from 'src/model/OrderBot'
import { PaymentsService } from '../payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import { SetOrderBotDTO } from './order-bot.dto'
import { Order } from 'src/model/Order'
import { UtilService } from 'src/util/util.service'
import { User } from 'src/model/User'
import * as _ from 'underscore';

@Injectable()
export class OrderBotService {
    logger: Logger = new Logger('OrderBotService')
    constructor(
        @InjectModel(OrderBot.name) private orderBotModel: Model<OrderBot>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        private paymentService: PaymentsService,
        private bitgetService: BitgetService
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
                throw new Error(`OrderBot with messageId ${orderBot.messageId} already exist`);
            }

            if (!orderBot.linkOrderId) {
                orderBot.linkOrderId = new Types.ObjectId()
            }

            const newOrderBot = new this.orderBotModel(orderBot)
            await newOrderBot.save()

            const users = await this.paymentService.getUsersSubscription(
                SubscriptionEnum.BOT,
            );
            return await Promise.all(
                users
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
                    ),
            )
        } catch (e) {
            this.logger.error('placeOrderBot', e)
            return {
                error: e.message,
            }
        }
    }

    async getOrderBots() {
        return await this.orderBotModel.find().sort({ createdAt: -1 }).limit(20).exec();
    }

    async findById(id: Types.ObjectId | string) {
        return await this.orderBotModel.findById(id).exec();
    }

    async setOrder(orderId: string, orderDTO: SetOrderBotDTO): Promise<string> {
        // const oldOrder = await this.orderBotModel.findByIdAndUpdate(orderId, { $set: orderDTO }).exec();
        const oldOrder = await this.orderBotModel.findById(orderId).exec();
        if (!oldOrder) throw new HttpException('Order not found', 404);

        
        const newTps = orderDTO.TPs.sort();
        const newPes = orderDTO.PEs.sort();
        if (oldOrder.side === 'short') {
            newTps.reverse();
            newPes.reverse();
        }
        
        const PEModif = UtilService.compareArraysNumber(oldOrder.PEs, orderDTO.PEs);
        const TPModif = UtilService.compareArraysNumber(oldOrder.TPs, orderDTO.TPs);
        const SLModif = oldOrder.SL !== orderDTO.SL;
        if (PEModif.length === 0 && TPModif.length === 0 && !SLModif) return 'Aucun modification n\'a été effectué';

        oldOrder.PEs = orderDTO.PEs;
        oldOrder.markModified('PEs');
        oldOrder.TPs = orderDTO.TPs;
        oldOrder.markModified('TPs');
        oldOrder.SL = orderDTO.SL;
        oldOrder.markModified('SL');
        const newOrderBot = await oldOrder.save();

        const orders = await this.orderModel.find({ linkOrderId: oldOrder.linkOrderId, terminated: false }).exec();
        const userMemo: { [key: string]: User } = {};
        let success = 0;
        let errors = 0;
        await Promise.all(orders.map(async (order) => {
            try {
                const PECurrentModif = PEModif.find(
                    (modif) => modif.oldNumber === order.PE,
                )
                // update or remove
                if (PECurrentModif && PECurrentModif.action === 'update') {
                    if (PECurrentModif.action === 'update') {
                        await this.bitgetService.updateOrderPE(order, PECurrentModif.newNumber);
                        success++;
                    }
                }
                if (TPModif.length > 0) {
                    await this.bitgetService.updateTPsOfOrder(order, orderDTO.TPs, userMemo[order.userId.toString()]);
                    success += TPModif.length;
                }

                if (SLModif) {
                    try {
                        await this.bitgetService.updateOrderSL(order, orderDTO.SL);
                        success++;
                    } catch (e) {
                        this.logger.error('setOrder => updateOrder', e, order.toObject(), 'update SL');
                        errors++;
                    }
                }
            } catch (e) {
                this.logger.error('setOrder', e, order.toObject());
                errors++;
            }
        }));
        return `${success} modification(s) effectué(s) avec succès. ${errors} erreurs rencontrée(s)`;
    }
}
