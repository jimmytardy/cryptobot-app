import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramClient } from 'telegram';

@Module({
  imports: [],
  providers: [TelegramService]
})
export class TelegramModule {}
