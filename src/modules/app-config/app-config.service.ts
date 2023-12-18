import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfig } from 'src/model/AppConfig';

@Injectable()
export class AppConfigService implements OnApplicationBootstrap {
    logger: Logger = new Logger('AppConfigService');
    config: AppConfig | undefined;
    constructor(@InjectModel('AppConfig') private appConfigModel: Model<AppConfig>) {
        this.config = undefined;
    }
    
    async onApplicationBootstrap() {
        if (!await this.appConfigModel.findOne()) {
            await this.appConfigModel.updateOne({}, {}, { upsert: true, setDefaultsOnInsert: true });
        }
    }
    
    async getConfig() {
        if (!this.config) {
            this.config = await this.appConfigModel.findOne().lean();
        }
        return this.config;
    }

    async setConfig(appConfigDTO: any) {
        this.config = undefined;
        return await this.appConfigModel.updateOne({}, appConfigDTO, { upsert: true });
    }

    async botCan(action: 'placeOrder' | 'cancelOrder' | 'updateOrder') {
        const config = await this.getConfig();
        return config && config.bot[action];
    }
}
