import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose';
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface';
import { Order } from 'src/model/Order';
import { StopLoss } from 'src/model/StopLoss';

@Injectable()
export class StopLossService {
    logger: Logger = new Logger('StopLossService');

    constructor(@InjectModel(StopLoss.name) private stopLossModel: Model<StopLoss>) {}

    async createFromOrder(order: Order, clOrderId: Types.ObjectId, orderId?: string): Promise<StopLoss> {
        this.logger.debug(`createFromOrder: order=${JSON.stringify(order)}, clOrderId=${JSON.stringify(clOrderId)}, orderId=${JSON.stringify(orderId)}`);
        return await new this.stopLossModel({
            clOrderId,
            price: order.SL,
            orderId,
            orderParentId: order._id,
            triggerPrice: order.SL,
            symbol: order.symbol,
            side: order.side,
            userId: order.userId,
            marginCoin: order.marginCoin,
            quantity: order.quantity,
        }).save()
    }
    
    async updateOne(stopLoss: Partial<StopLoss> & { _id: Types.ObjectId }, options?: QueryOptions<StopLoss>): Promise<StopLoss> {
        this.logger.debug(`updateOne: stopLoss=${JSON.stringify(stopLoss)}, options=${JSON.stringify(options)}`);
        return await this.stopLossModel.findByIdAndUpdate(stopLoss._id, { $set: stopLoss }, options)
    }

    async findOne(filter: FilterQuery<StopLoss>, select?: ProjectionType<StopLoss>, options?: QueryOptions<StopLoss>): Promise<StopLoss> {
        this.logger.debug(`findOne: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`);
        return await this.stopLossModel.findOne(filter, select, options)
    }

    async findAll(filter: FilterQuery<StopLoss>, select?: ProjectionType<StopLoss>, options?: QueryOptions<StopLoss>): Promise<StopLoss[]> {
        this.logger.debug(`findAll: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`);
        return await this.stopLossModel.find(filter, select, options)
    }

    async deleteOne(stopLossId:  Types.ObjectId): Promise<StopLoss> {
        this.logger.debug(`deleteOne: stopLossId=${JSON.stringify(stopLossId)}`);
        return await this.stopLossModel.findByIdAndDelete(stopLossId, { lean: true })
    }

    async cancel(filter: Omit<FilterQuery<StopLoss>, 'terminated'>) {
        this.logger.debug(`cancel: filter=${JSON.stringify(filter)}`)
        return await this.stopLossModel.updateMany({ ...filter, terminated: false }, { $set: { terminated: true, cancelled: true } })
    }

    getNewStep(numTPTrigger: number, strategy: IOrderStrategy): number {
        return strategy ? strategy[numTPTrigger] : numTPTrigger - 1 // numTPTrigger + 1 = Place dans la liste des steps, -2 pour obtenir le step actuel => numTPTrigger - 1
    }
}
