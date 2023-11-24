import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ModulesModule } from './modules/modules.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import configuration from './config/configuration'
import { join } from 'path'
import { ScheduleModule } from '@nestjs/schedule'
import { UtilService } from './util/util.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('database.uri'),
            }),
            inject: [ConfigService],
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, 'client'),
            exclude: ['/api/(.*)'],
        }),
        ModulesModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [AppService, UtilService],
})
export class AppModule {}
