import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { AppConfig, appConfigDefault } from 'src/model/AppConfig'
import { TasksService } from '../tasks/tasks.service'

@Injectable()
export class AppConfigService implements OnApplicationBootstrap {
    logger: Logger = new Logger('AppConfigService')
    config: AppConfig | undefined
    constructor(@InjectModel('AppConfig') private appConfigModel: Model<AppConfig>) {
        this.config = undefined
    }

    async onApplicationBootstrap() {
        const appConfig = await this.appConfigModel.findOne()
        if (!appConfig) {
            await this.appConfigModel.updateOne({}, {}, { upsert: true, setDefaultsOnInsert: true })
        } else if (appConfig.syncOrdersBitget === undefined) {
            await this.appConfigModel.updateOne(
                {},
                {
                    $set: {
                        syncOrdersBitget: appConfigDefault.syncOrdersBitget,
                    },
                },
            )
        }
    }

    async getConfig() {
        if (!this.config) {
            this.config = await this.appConfigModel.findOne().lean()
        }
        return this.config
    }

    async setConfig(appConfigDTO: any) {
        this.config = undefined
        return await this.appConfigModel.findOneAndUpdate({}, appConfigDTO, { upsert: true })
    }

    async botCan(action: 'placeOrder' | 'cancelOrder' | 'updateOrder') {
        const config = await this.getConfig()
        return config && config.bot[action]
    }
}
