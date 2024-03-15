import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from 'src/model/Subscription';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule, MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService]
})
export class SubscriptionModule {}
