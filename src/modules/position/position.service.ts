import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ProjectionType, QueryOptions, Types, UpdateQuery } from 'mongoose';
import { Position, PositionSynchroExchange } from 'src/model/Position';

@Injectable()
export class PositionService {
    logger: Logger = new Logger('PositionService');

    constructor(@InjectModel('Position') private positionModel: Model<Position>) {}

    async findOne(filter: FilterQuery<Position>, select?: ProjectionType<Position>, options?: QueryOptions<Position>): Promise<Position> {
        this.logger.debug(`findOne: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`);
        return await this.positionModel.findOne(filter, select, options)
    }

    async findOneAndCreate(filter: FilterQuery<Position>, position?: Partial<Position>, options?: Omit<Omit<QueryOptions<Position>, 'upsert'>, 'new'>): Promise<Position> {
        this.logger.debug(`findOneAndCreate: filter=${JSON.stringify(filter)}, position=${JSON.stringify(position)}, options=${JSON.stringify(options)}`);
        return await this.positionModel.findOneAndUpdate(filter, position || filter, { upsert: true, new: true, setDefaultsOnInsert: true, ...options })
    }

    async findOneAndUpdate(filter: FilterQuery<Position>, update: UpdateQuery<Position>, options?: QueryOptions<Position>): Promise<Position> {
        this.logger.debug(`findOneAndUpdate: filter=${JSON.stringify(filter)}, update=${JSON.stringify(update)} options=${JSON.stringify(options)}`);
        return await this.positionModel.findOneAndUpdate(filter, update, { new: true, lean: true,...options })
    }

    async updateOne(position: Partial<Position> & { _id: Types.ObjectId }, options?: QueryOptions<Position>): Promise<Position> {
        this.logger.debug(`updateOne: position=${JSON.stringify(position)}, options=${JSON.stringify(options)}`);
        return await this.positionModel.findByIdAndUpdate(position._id, { $set: position }, options)
    }
}
