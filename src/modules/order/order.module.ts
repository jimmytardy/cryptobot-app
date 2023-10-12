import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { StopLoss, StopLossSchema } from 'src/model/StopLoss';
import { TakeProfit, TakeProfitSchema } from 'src/model/TakeProfit';
import { Order, OrderSchema } from 'src/model/Order';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }, { name: TakeProfit.name, schema: TakeProfitSchema }, { name: StopLoss.name, schema: StopLossSchema }])],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
