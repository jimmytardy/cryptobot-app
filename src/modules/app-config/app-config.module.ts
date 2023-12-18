import { Global, Module } from '@nestjs/common'
import { AppConfigService } from './app-config.service'
import { AppConfigController } from './app-config.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { AppConfig, AppConfigSchema } from 'src/model/AppConfig'

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: AppConfig.name, schema: AppConfigSchema }])],
    providers: [AppConfigService],
    controllers: [AppConfigController],
    exports: [AppConfigService],
})
export class AppConfigModule {}
