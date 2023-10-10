import { Module, forwardRef } from '@nestjs/common';
import { BitgetWsService } from './bitget-ws.service';
import { BitgetModule } from '../bitget.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/model/Order';
import { BitgetService } from '../bitget.service';
import { BitgetUtilsModule } from '../bitget-utils/bitget-utils.module';
import { TakeProfit, TakeProfitSchema } from 'src/model/TakeProfit';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }, { name: TakeProfit.name, schema: TakeProfitSchema }]),
    forwardRef(() => BitgetModule)
  ],
  providers: [BitgetWsService]
})
export class BitgetWsModule { }
