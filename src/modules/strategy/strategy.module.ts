import { Module } from '@nestjs/common';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Strategy, StrategySchema } from 'src/model/Stategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: Strategy.name, schema: StrategySchema }])],
  controllers: [StrategyController],
  providers: [StrategyService],
  exports: [StrategyService]
})
export class StrategyModule {}
