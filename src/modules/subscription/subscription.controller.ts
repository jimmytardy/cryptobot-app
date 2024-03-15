import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionDTO } from './subscription.dto';

@Controller('subscription')
export class SubscriptionController {

    constructor(private subscriptionService: SubscriptionService) { }

    @Get()
    async getSubscriptions() {
        return await this.subscriptionService.findAll();
    }

    @Post(':id([0-9a-f]{24})')
    async setSubscription(@Param('id') id: string, @Body() subscriptionDTO: SubscriptionDTO) {
        return await this.subscriptionService.updateOne({ _id: id }, { $set: subscriptionDTO });
    }
}
