import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose'
import { Order } from 'src/model/Order'
import { TakeProfit } from 'src/model/TakeProfit'

@Injectable()
export class TakeProfitService {
    logger: Logger = new Logger('TakeProfitService')
    constructor(@InjectModel(TakeProfit.name) private takeProfitModel: Model<TakeProfit>) {}

    async findAll(filter: FilterQuery<TakeProfit>, select: ProjectionType<TakeProfit>, options: QueryOptions<TakeProfit>): Promise<TakeProfit[]> {
        this.logger.debug(`getTakeProfits: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.takeProfitModel.find(filter, select, options)
    }

    async updateOne(takeProfit: Partial<TakeProfit> & { _id: Types.ObjectId }, options?: QueryOptions<TakeProfit>): Promise<TakeProfit> {
        this.logger.debug(`updateOne: takeProfit=${JSON.stringify(takeProfit)}, options=${JSON.stringify(options)}`);
        return await this.takeProfitModel.findByIdAndUpdate(takeProfit._id, { $set: takeProfit }, options)
    }

    async deleteOne(filter: FilterQuery<TakeProfit>): Promise<TakeProfit> {
        this.logger.debug(`deleteOne: filter=${JSON.stringify(filter)}`)
        return await this.takeProfitModel.findOneAndDelete(filter, { lean: true })
    }

    async cancel(filter: Omit<FilterQuery<TakeProfit>, 'terminated'>) {
        this.logger.debug(`cancelTakeProfits: filter=${JSON.stringify(filter)}`)
        return await this.takeProfitModel.updateMany({ ...filter, terminated: false }, { $set: { terminated: true, cancelled: true } })
    }

    async createFromOrder(order: Order, triggerPrice: number, num: number, quantity: number, clOrderId: any, orderId: any): Promise<TakeProfit> {
        return await new this.takeProfitModel({
            triggerPrice,
            clOrderId,
            orderId,
            orderParentId: order._id,
            quantity,
            terminated: false,
            num: num,
            symbol: order.symbol,
            side: order.side,
            marginCoin: order.marginCoin,
            userId: order.userId,
        }).save()
    }
}
