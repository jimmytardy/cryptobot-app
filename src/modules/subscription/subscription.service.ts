import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Subscription, SubscriptionEnum } from 'src/model/Subscription';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class SubscriptionService implements OnApplicationBootstrap {
    logger = new Logger('SubscriptionService');

    constructor(@InjectModel(Subscription.name) private readonly subscriptionModel: Model<Subscription>, private tasksService: TasksService) { }

    async onApplicationBootstrap() {
        for (const subscriptionType of Object.values(SubscriptionEnum)) {
            const subscription = await this.subscriptionModel.findOne({ type: subscriptionType })
            if (!subscription) {
                await this.subscriptionModel.create({ type: subscriptionType })
            }
        }
    }
    async findAll(filter?: FilterQuery<Subscription>) {
        return await this.subscriptionModel.find(filter).exec();
    }

    async updateOne(filter: FilterQuery<Subscription>, update: UpdateQuery<Subscription>) {
        const result =  await this.subscriptionModel.updateOne(filter, update).exec();
        await this.tasksService.synchroSubscriptions();
        return result;
    }
}
