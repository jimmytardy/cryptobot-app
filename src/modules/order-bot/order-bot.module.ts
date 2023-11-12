import { Module } from '@nestjs/common';
import { OrderBotService } from './order-bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderBot, OrderBotSchema } from 'src/model/OrderBot';
import { PaymentsModule } from '../payment/payments.module';
import { BitgetModule } from '../plateforms/bitget/bitget.module';

@Module({
    imports: [PaymentsModule, BitgetModule, MongooseModule.forFeature([{ name: OrderBot.name, schema: OrderBotSchema }])],
    providers: [OrderBotService],
    exports: [OrderBotService],
})
export class OrderBotModule {}
