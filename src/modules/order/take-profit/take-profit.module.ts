import { Module } from '@nestjs/common';
import { TakeProfitService } from './take-profit.service';
import { Mongoose } from 'mongoose';
import { TakeProfit, TakeProfitSchema } from 'src/model/TakeProfit';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: TakeProfit.name, schema: TakeProfitSchema }])],
  providers: [TakeProfitService],
  exports: [TakeProfitService],
})
export class TakeProfitModule {}
