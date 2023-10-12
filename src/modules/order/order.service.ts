import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

    async disableOrder(orderId: string) {
        // disabled order
        const order = await this.orderModel.findOneAndUpdate({ orderId: orderId }, { terminated: true });
        await this.takeProfitModel.updateMany({ orderParentId: order._id }, { terminated: true });
        await this.stopLossModel.updateMany({ orderParentId: order._id }, { terminated: true });
        await this.orderModel.updateMany({ linkOrderId: order.linkOrderId, terminated: false, activated: false }, { terminated: true });
    }
}
