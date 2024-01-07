import { Global, Module, forwardRef } from '@nestjs/common'
import { AppConfigService } from './app-config.service'
import { AppConfigController } from './app-config.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { AppConfig, AppConfigSchema } from 'src/model/AppConfig'
import { TasksModule } from '../tasks/tasks.module'

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: AppConfig.name, schema: AppConfigSchema }])],
    providers: [AppConfigService],
    controllers: [AppConfigController],
    exports: [AppConfigService],
})
export class AppConfigModule {}
