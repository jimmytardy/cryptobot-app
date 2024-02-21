import { Global, Module } from '@nestjs/common';
import { RightService } from './right.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Right, RightSchema } from 'src/model/Right';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Right.name, schema: RightSchema }])],
  providers: [RightService],
  exports: [RightService],
})
export class RightModule {}
