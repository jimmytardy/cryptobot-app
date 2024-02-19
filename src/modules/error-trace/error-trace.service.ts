import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose'
import { ErrorTrace, ErrorTraceSeverity } from 'src/model/ErrorTrace'

@Injectable()
export class ErrorTraceService {
    logger: Logger = new Logger('ErrorTraceService')

    constructor(@InjectModel(ErrorTrace.name) private errorTraceModel: Model<ErrorTrace>) {}

    async createErrorTrace(functionName: string, userId: Types.ObjectId, severity: ErrorTraceSeverity, context: { error?: any, trace?: any } & any): Promise<void> {
        this.logger.error(
            `createErrorTrace: functionName=${JSON.stringify(functionName)}, userId=${JSON.stringify(userId)}, severity=${JSON.stringify(severity)}, context=${JSON.stringify(
                context,
            )}`,
        )
        if (context.error && context.error.stack && !context.trace) {
            context.trace = context.error.stack
        }
        await new this.errorTraceModel({ userId, severity, functionName, context }).save()
    }

    async findAll(filterQuery?: FilterQuery<ErrorTrace>, select?: ProjectionType<ErrorTrace>, options?: QueryOptions<ErrorTrace>) {
        this.logger.debug(`findAll: filterQuery=${JSON.stringify(filterQuery)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.errorTraceModel.find(filterQuery, select, options);
    }

    async findOne(filterQuery: FilterQuery<ErrorTrace>, select?: ProjectionType<ErrorTrace>, options?: QueryOptions<ErrorTrace>) {
        this.logger.debug(`findOne: filterQuery=${JSON.stringify(filterQuery)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.errorTraceModel.findOne(filterQuery, select, options);
    }

    async markAsFinished(errorTraceId: Types.ObjectId | string) {
        this.logger.debug(`markAsFinished: errorTraceId=${JSON.stringify(errorTraceId)}`)
        return await this.errorTraceModel.findByIdAndUpdate(errorTraceId, { $set: { finish: true } })
    }
}
