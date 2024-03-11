import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { StopLoss } from 'src/model/StopLoss'
import { TakeProfit } from 'src/model/TakeProfit'
import { User } from 'src/model/User'
import { UtilService } from 'src/util/util.service'
import _ from 'underscore'
import { TakeProfitService } from './take-profit/take-profit.service'
import * as exactMath from 'exact-math'
import { StopLossService } from './stop-loss/stop-loss.service'
import { BitgetUtilsService } from '../plateforms/bitget/bitget-utils/bitget-utils.service'
import { BitgetService } from '../plateforms/bitget/bitget.service'

export interface IOrderPopulated extends Omit<Omit<Order, 'SL'>, 'TPs'> {
    SL: StopLoss
    TPs: TakeProfit[]
}

@Injectable()
export class OrderService{
    logger: Logger = new Logger('OrderService')

    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        private takeProfitService: TakeProfitService,
        private stopLossService: StopLossService,
    ) {}

    async findOne(filter: FilterQuery<Order>, select?: ProjectionType<Order>, options?: QueryOptions<Order>): Promise<Order> {
        this.logger.debug(`findOne: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.orderModel.findOne(filter, select, options)
    }

    async findAll(filter: FilterQuery<Order>, select?: ProjectionType<Order>, options?: QueryOptions<Order>): Promise<Order[]> {
        this.logger.debug(`findAll: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.orderModel.find(filter, select, options).lean()
    }

    async updateOne(order: Partial<Order> & { _id: Types.ObjectId }, options?: QueryOptions<Order>): Promise<Order> {
        this.logger.debug(`updateOne: order=${JSON.stringify(order)}, options=${JSON.stringify(options)}`)
        return await this.orderModel.findByIdAndUpdate(order._id, { $set: order }, options)
    }

    async deleteOne(orderId: Types.ObjectId, options?: QueryOptions<Order>): Promise<Order> {
        this.logger.debug(`deleteOne: orderId=${JSON.stringify(orderId)}, options=${JSON.stringify(options)}`)
        return await this.orderModel.findByIdAndDelete(orderId, options)
    }

    async closeAllOrderOnSymbol(userId: Types.ObjectId, symbol: string) {
        const orderIds = await this.orderModel.distinct('_id', { userId, symbol, terminated: false })

        await this.orderModel.updateMany(
            { _id: { $in: orderIds } },
            {
                terminated: true,
                cancelled: true,
            },
        )

        await this.takeProfitService.cancel({ orderParentId: { $in: orderIds } })
        await this.stopLossService.cancel({ orderParentId: { $in: orderIds } })
    }

    async getOrderForActivation(orderId: Types.ObjectId, additionnalUpdated: Omit<Partial<Order>, 'inActivation'> = {}) {
        this.logger.debug(`getOrderForActivation: orderId=${orderId}, additionnalUpdated=${JSON.stringify(additionnalUpdated)}`)
        const order = await this.orderModel.findOneAndUpdate(
            {
                _id: orderId,
                inActivation: { $ne: true },
                activated: false,
            },
            {
                $set: {
                    inActivation: true,
                    ...additionnalUpdated,
                },
            },
            { new: true },
        )
        return order
    }

    async getStepsTriggers(order: Order): Promise<number[]> {
        // Array of PE + TPs for triggerPrice
        return order.steps;
    }

    async getSLTriggerCurrentFromOrder(order: Order, currentPrice?: number): Promise<number> {
        const takeProfitLastTrigger = await this.takeProfitService.findOne({ orderParentId: order._id, cancelled: false, terminated: true }, undefined, { sort: { num: -1 } })
        if (!takeProfitLastTrigger) return order.SL
        return await this.getSLTriggerFromStep(order, takeProfitLastTrigger.num - 1, currentPrice)
    }

    async getSLStepFromOrder(order: Order): Promise<number> {
        const takeProfitLastTrigger = await this.takeProfitService.findOne({ orderParentId: order._id, cancelled: false, terminated: true }, undefined, { sort: { num: -1 } })
        if (!takeProfitLastTrigger) return -1
        return takeProfitLastTrigger.num - 1
    }

    async getSLTriggerFromStep(order: Order, step: number, currentPrice?: number): Promise<number> {
        if (step === -1) {
            return order.SL
        } else {
            const stepsTriggers = await this.getStepsTriggers(order)
            if (stepsTriggers.length <= step) throw new Error('Step not found')
            if (!currentPrice) return stepsTriggers[step]
            else {
                for (let i = step; i >= 0; i--) {
                    if (order.side === 'long' && currentPrice > stepsTriggers[i]) return stepsTriggers[i]
                    if (order.side === 'short' && currentPrice < stepsTriggers[i]) return stepsTriggers[i]
                }
                return order.SL
            }
        }
    }

    async getTakeProfitTriggered(orderId: Types.ObjectId | string, select?: ProjectionType<TakeProfit>, options?: QueryOptions<TakeProfit>): Promise<TakeProfit[]> {
        return await this.takeProfitService.findAll({ orderParentId: orderId, terminated: true, cancelled: false, activated: true }, select, options)
    }

    async getTakeProfitNotTriggered(orderId: Types.ObjectId | string, select?: ProjectionType<TakeProfit>, options?: QueryOptions<TakeProfit>): Promise<TakeProfit[]> {
        return await this.takeProfitService.findAll({ orderParentId: orderId, terminated: false, cancelled: false, activated: false }, select, options)
    }

    async getQuantityAvailable(orderId: Types.ObjectId | string, order: Order = null): Promise<number> {
        if (!order) order = await this.orderModel.findById(orderId, 'quantity').lean()
        if (!order) throw new Error('Order not found')
        const TPQuantityClose = await this.getTakeProfitTriggered(order._id, 'quantity', { lean: true })
        return exactMath.sub(
            order.quantity,
            TPQuantityClose.reduce((acc, currentTP) => exactMath.add(acc, currentTP.quantity), 0),
        )
    }

    async cancelOrder(orderId: string | Types.ObjectId, cancelled = true) {
        // disabled order
        const order = await this.orderModel.findOneAndUpdate({ _id: orderId }, { terminated: true, cancelled })
        if (order) {
            await this.takeProfitService.cancel({ orderParentId: order._id })
            await this.stopLossService.cancel({ orderParentId: order._id })
        }
    }

    async disabledOrderLink(linkId: Types.ObjectId, userId: Types.ObjectId) {
        // disabled order
        await this.orderModel.updateMany(
            {
                linkOrderId: linkId,
                terminated: { $ne: true },
                activated: { $ne: true },
                userId,
            },
            { terminated: true },
        )
    }

    async getOrders(filterQuery: FilterQuery<Order>): Promise<IOrderPopulated[]> {
        try {
            const results = await this.orderModel.aggregate([
                {
                    $match: filterQuery,
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $lookup: {
                        from: 'takeprofits',
                        localField: '_id',
                        foreignField: 'orderParentId',
                        as: 'TPs',
                    },
                },
                {
                    $lookup: {
                        from: 'stoplosses',
                        localField: '_id',
                        foreignField: 'orderParentId',
                        as: 'SL',
                    },
                },
                {
                    $unwind: {
                        path: '$SL',
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ])
            return results
        } catch (e) {
            console.error('getOrders', e)
        }
    }

    validateOrder(order: Order) {
        if (order.activated) {
            throw new Error("L'ordre ne doit pas être activé à sa création")
        }
        if (order.quantity <= 0) {
            throw new Error("La quantité séléctionnée n'est pas suffisante")
        }
        if (order.terminated) {
            throw new Error("L'ordre ne doit pas être terminé à sa création")
        }
        if (order.cancelled) {
            throw new Error("L'ordre ne doit pas être annulé à sa création")
        }
        if (order.side === 'long') {
            if (order.SL >= order.PE) {
                throw new Error('La SL doit être inférieur au PE')
            }
            for (const tp of order.TPs) {
                if (tp <= order.PE) {
                    throw new Error('Chaque TP doit être supérieur au PE: ' + tp + ' <= ' + order.PE)
                }
            }
        }
        if (order.side === 'short') {
            if (order.SL <= order.PE) {
                throw new Error('La SL doit être supérieur au PE')
            }
            for (const tp of order.TPs) {
                if (tp >= order.PE) {
                    throw new Error('Chaque TP doit être inférieur au PE: ' + tp + ' >= ' + order.PE)
                }
            }
        }
    }

    async getActivePositions(userId: Types.ObjectId) {
        const orders = await this.getOrders({ userId, activated: true, terminated: false, cancelled: false })
        const positions = []
        for (const order of orders) {
            positions.push({
                symbol: order.symbol.replace('USDT', '').replace('_UMCBL', ''),
                side: order.side,
                PE: order.PE,
                SL: order.SL?.triggerPrice,
                TPs: UtilService.sortBySideObject<{ triggerPrice: number; activated: boolean }>(
                    order.TPs.map((tp) => ({ triggerPrice: tp.triggerPrice, activated: tp.activated })),
                    'triggerPrice',
                    order.side,
                ),
            })
        }
        return positions
    }
}
