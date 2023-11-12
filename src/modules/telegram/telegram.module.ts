import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramClient } from 'telegram';
import { TelegramController } from './telegram.controller';
import { OrderBot, OrderBotSchema } from 'src/model/OrderBot';
import { OrderBotModule } from '../order-bot/order-bot.module';

@Module({
  imports: [OrderBotModule, MongooseModule.forFeature([{ name: OrderBot.name, schema: OrderBotSchema }])],
  providers: [TelegramService],
  controllers: [TelegramController]
})
export class TelegramModule {}
