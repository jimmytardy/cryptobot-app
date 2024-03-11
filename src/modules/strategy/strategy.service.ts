import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose'
import { IOrderStrategy, SLStepEnum } from 'src/interfaces/order-strategy.interface'
import { Strategy } from 'src/model/Stategy'

@Injectable()
export class StrategyService implements OnModuleInit {
    logger: Logger = new Logger(StrategyService.name)

    constructor(@InjectModel(Strategy.name) private stategyModel: Model<Strategy>) {}

    async onModuleInit() {
        const defaultStrategy = await this.findOne({ default: true })
        if (!defaultStrategy) {
            this.logger.log('No default strategy found, creating one')
            await this.create({
                name: 'Stratégie Prudente',
                description:
                    "L'objectif de cette stratégie est de faire monter au plus tôt la SL après avoir pris la totalité des PE pour qu'elle suive la progression avec 2 TP de différence en cas de baisse du prix du marché. Cette stratégie d'avoir une progression lente mais sûr.",
                strategy: {
                    PE: [true, true],
                    SL: {
                        '0': SLStepEnum.PE_BAS,
                        '1': SLStepEnum.PE_HAUT,
                        '2': SLStepEnum.TP1,
                        '3': SLStepEnum.TP2,
                        '4': SLStepEnum.TP3,
                    },
                    TP: {
                        numAuthorized: [true, true, true, true, true, true],
                        TPSize: {
                            '1': [1],
                            '2': [0.5, 0.5],
                            '3': [0.25, 0.5, 0.25],
                            '4': [0.2, 0.3, 0.3, 0.2],
                            '5': [0.15, 0.2, 0.3, 0.2, 0.15], 
                            '6': [0.1, 0.15, 0.25, 0.25, 0.15, 0.1],
                        },
                    },
                },
                active: true,
                default: true,
            }) 
        }
    }

    async findAll(filter?: FilterQuery<Strategy>, select?: ProjectionType<Strategy>, options?: QueryOptions<Strategy>) {
        return await this.stategyModel.find(filter, select, options).exec()
    }

    async findOne(filter: FilterQuery<Strategy>, select?: ProjectionType<Strategy>, options?: QueryOptions<Strategy>): Promise<Strategy> {
        return await this.stategyModel.findOne(filter, select, options).lean().exec()
    }

    async getDefaultStrategy(): Promise<Strategy> {
        return await this.findOne({ default: true });
    }
    

    async create(strategy: Omit<Omit<Omit<Strategy, '_id'>, 'createdAt'>, 'updatedAt'>) {
        if (strategy.default) {
            await this.stategyModel.updateMany({ default: true }, { $set: { default: false } }).exec()
        }
        return await new this.stategyModel(strategy).save()
    }

    async findAndUpdateOne(strategy: Strategy) {
        if (strategy.default) {
            await this.stategyModel.updateMany({ default: true, _id: { $ne: strategy._id } }, { $set: { default: false } }).exec()
        }
        const newStrategy = await this.stategyModel.findByIdAndUpdate(strategy._id, strategy, { new: true, upsert: true }).exec()
        
    }
}
