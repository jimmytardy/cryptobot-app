import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { StopLoss } from 'src/model/StopLoss'
import { TakeProfit } from 'src/model/TakeProfit'
import { User } from 'src/model/User'
import { UtilService } from 'src/util/util.service'
import _ from 'underscore'

export interface IOrderPopulated extends Omit<Omit<Order, 'SL'>, 'TPs'> {
    SL: StopLoss
    TPs: TakeProfit[]
}

@Injectable()
export class OrderService implements OnApplicationBootstrap {
    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        @InjectModel(TakeProfit.name)
        private readonly takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name)
        private readonly stopLossModel: Model<StopLoss>,
    ) {}

    async onApplicationBootstrap() {
        const ordersIds = await this.orderModel.distinct('_id', { symbol: 'ETHUSDT_UMCBL', terminated: true }).exec()
        await this.orderModel.deleteMany({ _id: { $in: ordersIds }}).exec()
        await this.stopLossModel.deleteMany({ orderParentId: { $in: ordersIds }}).exec()
        await this.takeProfitModel.deleteMany({ orderParentId: { $in: ordersIds }}).exec()
    }

    async cancelOrder(
        orderId: string | Types.ObjectId,
        userId: Types.ObjectId,
        cancelled: boolean = false
    ) {
        // disabled order
        const order = await this.orderModel.findOneAndUpdate(
            { _id: orderId, userId },
            { terminated: true, cancelled },
            )
        if (order) {
            await this.takeProfitModel.updateMany(
                { orderParentId: order._id, terminated: { $ne: true }, userId },
                { terminated: true, cancelled: true },
            )
            await this.stopLossModel.updateMany(
                { orderParentId: order._id, terminated: { $ne: true }, userId },
                { terminated: true, cancelled: true },
            )
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

    async getFullOrders(user: User, filterQuery: FilterQuery<Order>) {
        const orders: (IOrderPopulated & any)[]= await this.getOrders(filterQuery);

        for (const order of orders) {
            for (const TP of order.TPs) {
                const pourcentage =  user.preferences.order.TPSize[order.TPs.length][TP.num - 1];
                TP.PnL = UtilService.getPnL(order.quantity * pourcentage, order.PE, TP.triggerPrice, order.side);
                TP.PnLPourcentage = TP.PnL / order.usdt * 100;
            }
        }
        return orders;
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
                    $unwind: '$SL',
                },
            ])
            return results
        } catch (e) {
            console.error('getOrders', e)
        }
    }

    checkNewOrder(order: Order) {
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
                    throw new Error(
                        'Chaque TP doit être supérieur au PE: ' +
                            tp +
                            ' <= ' +
                            order.PE,
                    )
                }
            }
        }
        if (order.side === 'short') {
            if (order.SL <= order.PE) {
                throw new Error('La SL doit être supérieur au PE')
            }
            for (const tp of order.TPs) {
                if (tp >= order.PE) {
                    throw new Error(
                        'Chaque TP doit être inférieur au PE: ' +
                            tp +
                            ' >= ' +
                            order.PE,
                    )
                }
            }
        }
    }
}
