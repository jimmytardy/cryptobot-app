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

    async cancelOrder(orderId: string | Types.ObjectId) {
        // disabled order
        const order = await this.orderModel.findOneAndUpdate({ orderId: orderId }, { terminated: true });
        if (order) {
            await this.takeProfitModel.updateMany({ orderParentId: order._id, }, { terminated: true, cancelled: true });
            await this.stopLossModel.updateMany({ orderParentId: order._id }, { terminated: true, cancelled: true });
            await this.orderModel.updateMany({ linkOrderId: order.linkOrderId, terminated: false, activated: false, cancelled: true }, { terminated: true });
        }
    }

    async disabledOrderLink(linkId: Types.ObjectId) {
        // disabled order
        await this.orderModel.updateMany({ linkOrderId: linkId, terminated: false, activated: false }, { terminated: true });
    }

    async terminateOrder(orderId: string | Types.ObjectId) {
        try {
            await this.orderModel.updateOne({ _id: orderId }, { terminated: true });
        } catch (e) {
            console.error('terminateOrder', e)
        }
    }
}
