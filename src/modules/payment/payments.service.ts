import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/model/User'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType } from 'mongoose'
import { Subscription, SubscriptionEnum } from 'src/model/Subscription'
import { ISubscriptionUser } from './payments.interface'

@Injectable()
export class PaymentsService {
    private stripe: Stripe

    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Subscription.name)
        private subscriptionModel: Model<Subscription>,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET'),
            {
                apiVersion: '2023-10-16',
            },
        )
    }

    async getUsersSubscription(
        type: SubscriptionEnum,
        select?: ProjectionType<User>,
    ): Promise<User[]> {
        const subscriptionModel = await this.subscriptionModel
            .findOne({ type })
            .lean()
            .exec()
        if (!subscriptionModel) return []
        const subscriptionsLists = await Promise.all(
            subscriptionModel.priceIds.map(
                async (priceId) =>
                    await this.stripe.subscriptions.list({ price: priceId }),
            ),
        )
        const subscriptions = subscriptionsLists.reduce(
            (acc, curr) => [...acc, ...curr.data],
            [],
        )
        const stripeIds: string[] = []
        for (const subscription of subscriptions) {
            if (
                stripeIds.includes(subscription.customer as string) ||
                !this.subscriptionIsActive(subscription.status)
            )
                continue
            stripeIds.push(subscription.customer as string)
        }

        return await this.userModel
            .find({ stripeCustomerId: { $in: stripeIds } }, select)
            .lean()
            .exec()
    }

    async getSubscriptions(stripeCustomerId: string): Promise<ISubscriptionUser> {
        const subscriptionsStripe = await this.stripe.subscriptions.list({
            customer: stripeCustomerId,
        })
        if (subscriptionsStripe.data[0]) {
            const subscription: any = {}
            const item = subscriptionsStripe.data[0].items.data[0]
            subscription.rights = await this.subscriptionModel
                .distinct('type', { priceIds: item.plan.id })
                .lean()
                .exec()
            const product = await this.stripe.products.retrieve(
                item.plan.product as string,
            )
            subscription.active = this.subscriptionIsActive(subscriptionsStripe.data[0].status)
            subscription.status = subscriptionsStripe.data[0].status
            subscription.name = product.name
            return subscription;
        }

        return null;
    }

    subscriptionIsActive(status: string): boolean {
        return (
            status === 'active' ||
            status === 'trialing' ||
            status === 'past_due'
        )
    }

    async webhookStripe(event: any): Promise<any> {
        switch (event.type) {
            case 'customer.created':
                await this.userModel
                    .updateOne(
                        { email: event.email },
                        { $set: { stripeCustomerId: event.data.object.id } },
                    )
                    .exec()
                break
            case 'checkout.session.completed':
                const session = event.data.object
                await this.userModel
                    .updateOne(
                        { email: session.customer_email },
                        { $set: { stripeCustomerId: session.customer } },
                    )
                    .exec()
                break
            default:
                console.info(`Unhandled event type ${event.type}`)
        }
        return { received: true }
    }

    async createCustomerPortalSession(
        user: User,
        origin: string,
    ): Promise<any> {
        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: origin + '/payment',
        })
        return session.url
    }
}
