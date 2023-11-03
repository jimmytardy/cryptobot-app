import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from 'src/model/Order';
import { StopLoss } from 'src/model/StopLoss';
import { TakeProfit } from 'src/model/TakeProfit';

@Injectable()
export class OrderService {

    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        @InjectModel(TakeProfit.name) private readonly takeProfitModel: Model<TakeProfit>,
        @InjectModel(StopLoss.name) private readonly stopLossModel: Model<StopLoss>
    ) { }

    async cancelOrder(orderId: string | Types.ObjectId, userId: Types.ObjectId) {
        // disabled order
        const order = await this.orderModel.findOneAndUpdate({ orderId: orderId, userId }, { terminated: true });
        if (order) {
            await this.takeProfitModel.updateMany({ orderParentId: order._id, terminated: { $ne: true }, userId }, { terminated: true, cancelled: true });
            await this.stopLossModel.updateMany({ orderParentId: order._id, terminated: { $ne: true }, userId }, { terminated: true, cancelled: true });
            await this.orderModel.updateMany({ linkOrderId: order.linkOrderId, terminated: { $ne: true }, userId }, { terminated: true, cancelled: true });
        }
    }

    async disabledOrderLink(linkId: Types.ObjectId, userId: Types.ObjectId) {
        // disabled order
        await this.orderModel.updateMany({ linkOrderId: linkId, terminated: { $ne: true }, activated: { $ne: true }, userId }, { terminated: true });
    }

    async getOrders(userId: Types.ObjectId) {
        try {
            const results = await this.orderModel.aggregate([
                {
                    $match: {
                        userId: userId,
                        terminated: false,
                    }
                },
                {
                    $lookup: {
                        from: 'takeprofits',
                        localField: '_id',
                        foreignField: 'orderParentId',
                        as: 'TPs'
                    }
                },
                {
                    $lookup: {
                        from: 'stoplosses',
                        localField: '_id',
                        foreignField: 'orderParentId',
                        as: 'SL'
                    }
                },
                {
                    $unwind: '$SL'
                }
            ]);
            return results

        } catch (e) {
            console.error('getOrders', e)
        }
    }
}
