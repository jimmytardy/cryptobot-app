import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, Types } from 'mongoose'
import { IUserPreferencesOrder, User } from 'src/model/User'
import {
    CreateUserDTO,
    ProfileUpdateDTO,
    UpdatePreferencesDTO,
} from './user.dto'
import { genSalt, hash } from 'bcrypt'
import { PlateformsService } from '../plateforms/plateforms.service'
import { FuturesClient } from 'bitget-api'
import { PaymentsService } from '../payment/payments.service'
import { OrderService } from '../order/order.service'
import { TakeProfit } from 'src/model/TakeProfit'
import { Order } from 'src/model/Order'

@Injectable()
export class UserService implements OnApplicationBootstrap {
    logger: Logger
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private plateformsService: PlateformsService,
        private paymentService: PaymentsService,
        private orderService: OrderService
    ) {
        this.logger = new Logger('UserService')
    }

    async onApplicationBootstrap() {
        const users = await this.getListOfTraders()
        await this.plateformsService.initializeTraders(users)
    }

    async findByEmail(
        email: string,
        select?: ProjectionType<User>,
    ): Promise<User | undefined> {
        return await this.userModel.findOne({ email }, select).lean()
    }

    async findById(
        id: string | Types.ObjectId,
        select?: ProjectionType<User>,
    ): Promise<User | undefined> {
        return await this.userModel.findById(id, select).lean()
    }

    async create(user: CreateUserDTO) {
        const salt = await genSalt()

        const exists = await this.findByEmail(user.email)
        if (exists) throw new Error("L'email existe déjà")

        try {
            // A voir la vérification
            const client = new FuturesClient({
                apiKey: user.bitget.api_key,
                apiPass: user.bitget.api_pass,
                apiSecret: user.bitget.api_secret_key,
            })
            await client.getAccounts('umcbl')
        } catch (e) {
            throw new Error(
                'Les informations de la clé API ne sont pas correctes',
            )
        }

        const newUser = await new this.userModel({
            ...user,
            password: await hash(user.password, salt),
        }).save()
        this.plateformsService.addNewTrader(newUser)
        return newUser
    }

    async getListOfTraders(): Promise<User[]> {
        return await this.userModel.find()
    }

    async getPreferences(userId: Types.ObjectId) {
        return (await this.userModel.findById(userId, 'preferences').lean())
            .preferences
    }

    async setPreferences(
        userId: Types.ObjectId,
        updatePreferencesDTO: UpdatePreferencesDTO,
    ) {
        try {
            await this.userModel.updateOne(
                { _id: userId },
                { $set: { preferences: updatePreferencesDTO } },
            )
            return { success: true }
        } catch (e) {
            this.logger.error(e)
            return { success: false }
        }
    }

    async setProfile(userId: Types.ObjectId, body: ProfileUpdateDTO) {
        try {
            await this.userModel.updateOne({ _id: userId }, { $set: body })
            return { success: true, message: 'Modifié avec succès' }
        } catch (e) {
            this.logger.error(e)
            throw new Error(e)
        }
    }

    async getProfile(user: User) {
        const { bitget, preferences, ...userInfo } = user
        return {
            ...userInfo,
            subscription: await this.getSubscriptions(user),
        }
    }

    async getSubscriptions(user: User) {
        const { stripeCustomerId } = await this.findById(
            user._id,
            '+stripeCustomerId',
        )
        if (!stripeCustomerId) return {}
        return await this.paymentService.getSubscriptions(stripeCustomerId)
    }

    async getOrdersStats(userId: Types.ObjectId, dateFrom: Date, dateTo: Date) {
        const filterQuery: FilterQuery<Order> = {
            userId,
            ...(dateFrom ? { createdAt: { $gte: dateFrom } } : {}),
            ...(dateTo ? { createdAt: { $lte: dateTo } } : {}),
        }
        const orders = await this.orderService.getOrders(filterQuery);
        const results = {
            nbTerminated: 0,
            nbInProgress: 0,
            nbWaitToSendPlateform: 0,
            nbTotalTP: 0,
            nbTP: [0, 0, 0, 0, 0, 0],
            nbTotalSL: 0,
            nbSL: {
                '-1': 0,
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0
            },
        }

        for (const order of orders) {
            if (!order.sendToPlateform) {
                results.nbWaitToSendPlateform++;
                continue;
            }
            if (order.terminated) results.nbTerminated++;
            else results.nbInProgress++;
            if (!order.activated) continue;
            if (order.TPs) {
                const TPs = order.TPs.sort((a, b) => b.triggerPrice - a.triggerPrice);
                if (order.side === 'short') TPs.reverse();
                
                for (let i = 0; i < TPs.length; i++) {
                    if (TPs[i].activated) {
                        results.nbTotalTP++;
                        results.nbTP[i]++;
                    }
                }
            }
            
            if (order.SL?.activated) {
                results.nbSL[order.SL.step]++;
                results.nbTotalSL++;
            }
        }
        return results;
    }
}
