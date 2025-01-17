import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderSchema } from 'src/model/Order';
import { MongooseModule } from '@nestjs/mongoose';
import { TakeProfitModule } from './take-profit/take-profit.module';
import { StopLossModule } from './stop-loss/stop-loss.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]), TakeProfitModule, StopLossModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
