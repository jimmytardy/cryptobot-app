import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram.controller';
import { OrderBot, OrderBotSchema } from 'src/model/OrderBot';
import { OrderBotModule } from '../order-bot/order-bot.module';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';

@Module({
  imports: [OrderBotModule, UserModule, MongooseModule.forFeature([{ name: OrderBot.name, schema: OrderBotSchema }])],
  providers: [TelegramService, JwtService],
  controllers: [TelegramController]
})
export class TelegramModule {}
