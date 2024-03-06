import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { Strategy } from 'src/model/Stategy';

@Injectable()
export class StrategyService {
    logger: Logger = new Logger(StrategyService.name);

    constructor(@InjectModel(Strategy.name) private stategyModel: Model<Strategy>) {   }

    async findAll(filter?: FilterQuery<Strategy>, select?: ProjectionType<Strategy>, options?: QueryOptions<Strategy>) {
        return await this.stategyModel.find(filter, select, options).exec();
    }
}
