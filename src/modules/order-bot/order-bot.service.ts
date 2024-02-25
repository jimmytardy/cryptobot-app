import { HttpException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType, Types } from 'mongoose'
import { OrderBot } from 'src/model/OrderBot'
import { PaymentsService } from '../payment/payments.service'
import { SubscriptionEnum } from 'src/model/Subscription'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import { SetOrderBotDTO } from './order-bot.dto'
import { Order } from 'src/model/Order'
import { UtilService } from 'src/util/util.service'
import { User } from 'src/model/User'
import * as _ from 'underscore'
import { OrderService } from '../order/order.service'
import { UserService } from '../user/user.service'

@Injectable()
export class OrderBotService {
    logger: Logger = new Logger('OrderBotService')
    constructor(
        @InjectModel(OrderBot.name) private orderBotModel: Model<OrderBot>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        private userService: UserService,
        private paymentService: PaymentsService,
        private bitgetService: BitgetService,
        private orderService: OrderService,
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
            orderBot.PEs = numbersPE.map((num) => parseFloat((num || '').replaceAll(',', '.'))).filter((pe) => !isNaN(pe))
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
        orderBot.SL = parseFloat(lines[i].split(':')[1].replaceAll(',', '.').trim())
        return orderBot
    }

    async resumeOrderBot(orderId: string | Types.ObjectId) {
        const orderBot = await this.orderBotModel.findById(orderId).exec()
        if (!orderBot) throw new HttpException('OrderBot not found', 404)
        if (!orderBot.resumes) orderBot.resumes = []
        orderBot.resumes.push(new Date())
        orderBot.markModified('resumes')
        await orderBot.save()
        const orderAlreadyPlaced = await this.orderModel
            .find({
                linkOrderId: orderBot.linkOrderId,
                terminated: false,
            })
            .exec()
        const orderAlreadyPlacedGrouped = _.groupBy(orderAlreadyPlaced, 'userId')
        const userIdsAlreadyPlaced = Object.keys(orderAlreadyPlacedGrouped)
            .filter((userId) => orderAlreadyPlacedGrouped[userId].length >= 1)
            .map((userId) => new Types.ObjectId(userId))
        const users = await this.userService.getUsersWithSubscription(SubscriptionEnum.BOT, { _id: { $nin: userIdsAlreadyPlaced } })
        await this.placeOrderBot(orderBot, users)
    }

    async createOrderBot(orderBot: OrderBot) {
        try {
            const orderExist = await this.orderBotModel.findOne({
                messageId: orderBot.messageId,
            })
            if (orderExist) {
                throw new Error(`OrderBot with messageId ${orderBot.messageId} already exist`)
            }

            if (!orderBot.linkOrderId) {
                orderBot.linkOrderId = new Types.ObjectId()
            }

            const newOrderBot = new this.orderBotModel(orderBot)
            await newOrderBot.save()
            const users = await this.userService.getUsersWithSubscription(SubscriptionEnum.BOT)
            await this.placeOrderBot(orderBot, users)
            return {
                message: 'Ordre de bot crée avec succès',
            }
        } catch (e) {
            this.logger.error('placeOrderBot', e)
            return {
                error: e.message,
            }
        }
    }

    async placeOrderBot(orderBot: OrderBot, users: User[]) {
        try {
            const userFiltered = users.filter((user) => !user.preferences.order.baseCoinAuthorized || user.preferences.order.baseCoinAuthorized.includes(orderBot.baseCoin))
            const price = await this.bitgetService.getCurrentPrice('baseCoin', orderBot.baseCoin)
            const symbolRules = await this.bitgetService.getSymbolBy('baseCoin', orderBot.baseCoin)
            if (!symbolRules) throw new Error(`Symbol ${orderBot.baseCoin} not found`)
            return await Promise.all(
                userFiltered.map(async (user) => {
                    const alreadyPlaced = await this.orderService.findOne({ symbol: symbolRules.symbol, userId: user._id, terminated: false });
                    if (!alreadyPlaced) {
                        const orderCloned = JSON.parse(JSON.stringify(orderBot)) // if shift PE/TPs/SL, not share array
                        await this.bitgetService.placeOrder(orderCloned, user, orderBot.linkOrderId, price).catch((error) => {
                            this.logger.error('placeOrderBot > Promise.map > catch', user._id, error)
                        })
                    }
                }),
            )
        } catch (e) {
            this.logger.error('placeOrderBot', e)
            return {
                error: e.message,
            }
        }
    }

    async getOrderBots() {
        return await this.orderBotModel
            .find({ deleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec()
    }

    async findById(id: Types.ObjectId | string) {
        return await this.orderBotModel.findById(id).exec()
    }

    async findByMessageId(messageId: string, select?: ProjectionType<OrderBot>) {
        return await this.orderBotModel.findOne({ messageId, deleted: { $ne: true } }, select).exec()
    }

    async setOrder(orderId: string | Types.ObjectId, orderDTO: SetOrderBotDTO): Promise<string> {
        // const oldOrder = await this.orderBotModel.findByIdAndUpdate(orderId, { $set: orderDTO }).exec();
        const oldOrder = await this.orderBotModel.findById(orderId).exec()
        if (!oldOrder) throw new HttpException('Order not found', 404)

        const newTps = UtilService.sortBySide(orderDTO.TPs, oldOrder.side)
        const newPes = UtilService.sortBySide(orderDTO.PEs, oldOrder.side)

        const PEModif = UtilService.compareArraysNumber(oldOrder.PEs, newPes)
        const TPModif = UtilService.compareArraysNumber(oldOrder.TPs, newTps)
        const SLModif = oldOrder.SL !== orderDTO.SL
        if (PEModif.length === 0 && TPModif.length === 0 && !SLModif) return "Aucun modification n'a été effectué"

        oldOrder.PEs = newPes
        oldOrder.markModified('PEs')
        oldOrder.TPs = newTps
        oldOrder.markModified('TPs')
        oldOrder.SL = orderDTO.SL
        oldOrder.markModified('SL')
        await oldOrder.save()

        const orders = await this.orderModel.find({ linkOrderId: oldOrder.linkOrderId, terminated: false }).exec()
        const userMemo: { [key: string]: User } = {}
        const priceMemo: { [key: string]: number } = {}
        let success = 0
        let errors = 0
        await Promise.all(
            orders.map(async (order) => {
                try {
                    if (!userMemo[order.userId.toString()]) {
                        userMemo[order.userId.toString()] = await this.userModel.findById(order.userId).exec()
                    }
                    const PECurrentModif = PEModif.find((modif) => modif.oldNumber === order.PE)
                    // update or remove
                    if (PECurrentModif && PECurrentModif.action === 'update') {
                        if (PECurrentModif.action === 'update') {
                            await this.bitgetService.updateOrderPE(order, PECurrentModif.newNumber)
                            success++
                        }
                    }
                    if (TPModif.length > 0) {
                        if (!priceMemo[order.symbol]) priceMemo[order.symbol] = await this.bitgetService.getCurrentPrice('symbol', order.symbol)
                        await this.bitgetService.updateTPsOfOrder(order, orderDTO.TPs, userMemo[order.userId.toString()], priceMemo[order.symbol])
                        success += TPModif.length
                    }

                    if (SLModif) {
                        try {
                            await this.bitgetService.updateOrderSL(order, orderDTO.SL)
                            success++
                        } catch (e) {
                            this.logger.error('setOrder => updateOrder', e, order.toObject(), 'update SL')
                            errors++
                        }
                    }
                } catch (e) {
                    this.logger.error('setOrder', e, order.toObject())
                    errors++
                }
            }),
        )
        return `${success} modification(s) effectué(s) avec succès. ${errors} erreurs rencontrée(s)`
    }

    async deleteOrderBot(orderBotId: string | Types.ObjectId) {
        const orderBot = await this.orderBotModel.findById(orderBotId).exec()
        if (!orderBot) throw new HttpException('OrderBot not found', 404)

        const orders = await this.orderModel.find({ linkOrderId: orderBot.linkOrderId, terminated: false }).lean().exec()
        await Promise.all(
            orders.map(async (order) => {
                try {
                    await this.bitgetService.cancelOrder(order)
                } catch (e) {
                    this.logger.error('deleteOrderBot', e, orderBot.toObject())
                }
            }),
        )
    }

    async closeForcePosition(orderId: string) {
        const orderBot = await this.orderBotModel.findById(orderId, 'baseCoin').exec()
        const symbol = await this.bitgetService.getSymbolBy('baseCoin', orderBot.baseCoin)
        const users = await this.userService.getUsersWithSubscription(SubscriptionEnum.BOT)
        const request = []
        for (const user of users) {
            request.push(this.bitgetService.closePosition(symbol.symbol, user._id))
        }
        await Promise.all(request)
        return { status: true }
    }

    async synchronizeAllSLOrderBot(orderBotId: string) {
        const orderBot = await this.orderBotModel.findById(orderBotId).lean().exec()
        const userIds = await this.orderModel.distinct('userId', { linkOrderId: orderBot.linkOrderId, terminated: false, activated: true }).exec();
        const users = await this.userService.getUsersWithSubscription(SubscriptionEnum.BOT, { _id: { $in: userIds }});
        const symbolRules = await this.bitgetService.getSymbolBy('baseCoin', orderBot.baseCoin)
        const request = []
        for (const user of users) {
            request.push(this.bitgetService.synchronizeAllSL(user._id, symbolRules.symbol))
        }
        await Promise.all(request)
        return { status: true }
    }
}
