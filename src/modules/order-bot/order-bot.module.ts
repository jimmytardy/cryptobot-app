import { Module } from '@nestjs/common';
import { OrderBotService } from './order-bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderBot, OrderBotSchema } from 'src/model/OrderBot';
import { PaymentsModule } from '../payment/payments.module';
import { BitgetModule } from '../plateforms/bitget/bitget.module';
import { OrderBotController } from './order-bot.controller';
import { Order, OrderSchema } from 'src/model/Order';
import { User, UserSchema } from 'src/model/User';

@Module({
    imports: [PaymentsModule, BitgetModule, MongooseModule.forFeature([{ name: OrderBot.name, schema: OrderBotSchema }, { name: Order.name, schema: OrderSchema }, { name: User.name, schema: UserSchema }])],
    providers: [OrderBotService],
    exports: [OrderBotService],
    controllers: [OrderBotController],
})
export class OrderBotModule {}
