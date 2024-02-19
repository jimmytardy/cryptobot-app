import { Module } from '@nestjs/common';
import { PositionService } from './position.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PositionSchema } from 'src/model/Position';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Position', schema: PositionSchema }])],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
