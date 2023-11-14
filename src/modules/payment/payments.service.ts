import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/model/User'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType } from 'mongoose'
import { Subscription, SubscriptionEnum } from 'src/model/Subscription'

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

    async getUsersSubscription(type: SubscriptionEnum, select?: ProjectionType<User>): Promise<User[]> {
        const subscription = await this.subscriptionModel.findOne({ type }).lean().exec();
        if (!subscription) return [];
        const subscriptions = await this.stripe.subscriptions.list({
            price: subscription.priceId,
        });
        const stripeIds: string[] = []
        for (const subscription of subscriptions.data) {
            if (stripeIds.includes(subscription.customer as string) || !this.subscriptionIsActive(subscription.status)) continue;
            stripeIds.push(subscription.customer as string)
        }

        return await this.userModel
            .find({ stripeCustomerId: { $in: stripeIds } }, select)
            .lean()
            .exec()
    }

    async getSubscriptions(stripeCustomerId: string): Promise<any> {
        const subscriptionsStripe = await this.stripe.subscriptions.list({
            customer: stripeCustomerId,
        });
        const suscription = {}
        for (const subscriptionStripe of subscriptionsStripe.data) {
            for (const item of subscriptionStripe.items.data) {
                const sub = await this.subscriptionModel
                    .findOne({ priceId: item.plan.id })
                    .lean()
                    .exec()
                if (!sub) continue
                const product = await this.stripe.products.retrieve(
                    item.plan.product as string,
                )
                suscription[sub.type] = {
                    ...sub,
                    name: product.name,
                    active: this.subscriptionIsActive(subscriptionStripe.status),
                    status: subscriptionStripe.status,
                }
                delete suscription[sub.type].priceId
            }
        }

        return suscription
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

    async createCustomerPortalSession(user: User, origin: string): Promise<any> {
        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: origin + '/payment',
        })
        return session.url
    }
}
