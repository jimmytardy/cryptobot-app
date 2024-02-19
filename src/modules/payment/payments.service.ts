import Stripe from 'stripe'
import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/model/User'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType } from 'mongoose'
import { Subscription, SubscriptionEnum } from 'src/model/Subscription'
import { ISubscriptionUser } from './payments.interface'
import { PlateformsService } from '../plateforms/plateforms.service'
import _ from 'underscore'

@Injectable()
export class PaymentsService {
    private stripe: Stripe

    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Subscription.name)
        private subscriptionModel: Model<Subscription>,
        @Inject(forwardRef(() => PlateformsService)) private plateformsService: PlateformsService
    ) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET'), {
            apiVersion: '2023-10-16',
        })
    }

    private async getUsersSubscription(type: SubscriptionEnum, filter?: FilterQuery<Omit<User, 'stripeCustomerId'>>, select?: ProjectionType<User>): Promise<User[]> {
        const subscriptionModel = await this.subscriptionModel.findOne({ type }).lean().exec()
        if (!subscriptionModel) return []
        const subscriptionsLists = await Promise.all(subscriptionModel.priceIds.map(async (priceId) => await this.stripe.subscriptions.list({ price: priceId })))
        const subscriptions = subscriptionsLists.reduce((acc, curr) => [...acc, ...curr.data], [])
        const stripeIds: string[] = []
        for (const subscription of subscriptions) {
            if (stripeIds.includes(subscription.customer as string) || !this.subscriptionIsActive(subscription.status)) continue
            stripeIds.push(subscription.customer as string)
        }

        return await this.userModel
            .find({ stripeCustomerId: { $in: stripeIds }, ...(filter || {}) }, select)
            .lean()
            .exec()
    }

    async getSubscription(stripeCustomerId: string): Promise<ISubscriptionUser> {
        const subscriptionsStripe = await this.stripe.subscriptions.list({
            customer: stripeCustomerId,
        })
        if (subscriptionsStripe.data[0]) {
            const subscription: any = {}
            const item = subscriptionsStripe.data[0].items.data[0]
            subscription.rights = await this.subscriptionModel.distinct('type', { priceIds: item.plan.id }).lean().exec()
            const product = await this.stripe.products.retrieve(item.plan.product as string)
            subscription.active = this.subscriptionIsActive(subscriptionsStripe.data[0].status)
            subscription.status = subscriptionsStripe.data[0].status
            subscription.name = product.name
            return subscription
        }

        return null
    }

    async actualizeSubscription(user: User) {
        if (!user.stripeCustomerId) return
        const subscription = await this.getSubscription(user.stripeCustomerId) 
        if (!_.isEqual(user.subscription, subscription)) {
            user.subscription = subscription
            await this.userModel.findByIdAndUpdate(user._id, { $set: { subscription } }).exec()
            if (subscription?.active) {
                this.plateformsService.addNewTrader(user)
            } else {
                this.plateformsService.removeTrader(user)
            }
        }
    }

    subscriptionIsActive(status: string): boolean {
        return status === 'active' || status === 'trialing' || status === 'past_due'
    }

    async webhookStripe(event: any): Promise<any> {
        console.log('payement webhook', event.type)
        let user;
        switch (event.type) {
            case 'customer.created':
                user = await this.userModel.findOneAndUpdate({ email: event.email }, { $set: { stripeCustomerId: event.data.object.id }, }, { fields: '+stripeCustomerId' , new: true }).exec()
                await this.actualizeSubscription(user)
                break
            case 'checkout.session.completed':
                const session = event.data.object
                user = await this.userModel.findOneAndUpdate({ email: session.customer_email }, { $set: { stripeCustomerId: session.customer } }, { new: true }).exec()
                await this.actualizeSubscription(user)
                break
            default:
                if ((event.type as  string).startsWith('customer.subscription')) {
                    user = await this.userModel.findOne({ stripeCustomerId: event.data.object.customer }).lean().exec();
                    await this.actualizeSubscription(user)
                } else {
                    console.info(`Unhandled event type ${event.type}`)
                }
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
