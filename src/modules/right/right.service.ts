import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Right, RightEnum } from 'src/model/Right'

@Injectable()
export class RightService implements OnApplicationBootstrap {
    logger: Logger = new Logger('RightService')

    constructor(@InjectModel(Right.name) private rightModel: Model<Right>, private configService: ConfigService) {}

    async onApplicationBootstrap() {
        const userIds = []
        if (this.configService.get<string>('ENV').toUpperCase() === 'DEV') {
            userIds.push(new Types.ObjectId('652d64d41839bcc4d27fe308'))// tardy
        } else {
            userIds.push(new Types.ObjectId('652ef1cd63e288c8cf606894'))// jimmy
            userIds.push(new Types.ObjectId('6593466ffc28b0dcbbeff218'))// leo
            userIds.push(new Types.ObjectId('65d5c2ec6ce088bb718fc7e5'))// mattias
        }
        await this.rightModel.updateMany({ name: { $in: Object.values(RightEnum) } }, { userIds }, { upsert: true })
    }

    async getRights(userId: Types.ObjectId): Promise<string[]> {
        return await this.rightModel.distinct('name', { userIds: userId }).exec()
    }

    async checkRight(userId: string | Types.ObjectId, name: string) {
        return Boolean(await this.rightModel.findOne({ name, userIds: userId }).lean().exec())
    }

    async addUserRight(userId: string | Types.ObjectId, name: string) {
        return await this.rightModel.updateOne({ name }, { $push: { userIds: userId } })
    }

    async removeUserRight(userId: string | Types.ObjectId, name: string) {
        return await this.rightModel.updateOne({ name }, { $pull: { userIds: userId } })
    }
}
