import { Module } from '@nestjs/common';
import { StopLossService } from './stop-loss.service';
import { StopLoss, StopLossSchema } from 'src/model/StopLoss';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: StopLoss.name, schema: StopLossSchema }])],
  providers: [StopLossService],
  exports: [StopLossService],
})
export class StopLossModule {}
