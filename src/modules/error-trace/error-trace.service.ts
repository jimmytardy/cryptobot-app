import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ErrorTrace, ErrorTraceSeverity } from 'src/model/ErrorTrace'

@Injectable()
export class ErrorTraceService {
    logger: Logger = new Logger('ErrorTraceService')

    constructor(@InjectModel(ErrorTrace.name) private errorTraceModel: Model<ErrorTrace>) {}

    async createErrorTrace(functionName: string, userId: Types.ObjectId, severity: ErrorTraceSeverity, context: unknown): Promise<void> {
        this.logger.error(
            `createErrorTrace: functionName=${JSON.stringify(functionName)}, userId=${JSON.stringify(userId)}, severity=${JSON.stringify(severity)}, context=${JSON.stringify(
                context,
            )}`,
        )
        await new this.errorTraceModel({ userId, severity, functionName, context }).save()
    }
}
