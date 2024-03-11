import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleInit, forwardRef } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose'
import { IUserPreferences, User } from 'src/model/User'
import { CreateUserDTO, ProfileUpdateDTO, UpdatePreferencesDTO } from './user.dto'
import { genSalt, hash } from 'bcrypt'
import { PlateformsService } from '../plateforms/plateforms.service'
import { FuturesClient } from 'bitget-api'
import { OrderService } from '../order/order.service'
import { TakeProfit } from 'src/model/TakeProfit'
import { Order } from 'src/model/Order'
import { BitgetService } from '../plateforms/bitget/bitget.service'
import _ from 'underscore'
import { SubscriptionEnum } from 'src/model/Subscription'
import { RightService } from '../right/right.service'
import { UtilService } from 'src/util/util.service'
import { StrategyService } from '../strategy/strategy.service'
import { IOrderStrategy } from 'src/interfaces/order-strategy.interface'
import { Strategy } from 'src/model/Stategy'

@Injectable()
export class UserService implements OnApplicationBootstrap {
    logger: Logger = new Logger('UserService')
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject(forwardRef(() => PlateformsService)) private plateformsService: PlateformsService,
        private orderService: OrderService,
        private rightService: RightService,
        private strategyService: StrategyService,
    ) {}

    async onApplicationBootstrap() {
        const users = await this.getListOfTraders()
        await this.plateformsService.initializeTraders(users)
    }

    async findByEmail(email: string, select?: ProjectionType<User>): Promise<User | undefined> {
        return await this.userModel.findOne({ email }, select).lean()
    }

    async findById(id: string | Types.ObjectId, select?: ProjectionType<User>): Promise<User | undefined> {
        return await this.userModel.findById(id, select).lean()
    }

    async findAll(filter?: FilterQuery<User>, select?: ProjectionType<TakeProfit>, options?: QueryOptions<User>): Promise<User[]> {
        this.logger.debug(`findAll: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.userModel.find(filter, select, options)
    }

    async findOne(filter?: FilterQuery<User>, select?: ProjectionType<TakeProfit>, options?: QueryOptions<User>): Promise<User> {
        this.logger.debug(`findOne: filter=${JSON.stringify(filter)}, select=${JSON.stringify(select)}, options=${JSON.stringify(options)}`)
        return await this.userModel.findOne(filter, select, options)
    }

    async updateOne(order: Partial<User> & { _id: Types.ObjectId }, options?: QueryOptions<User>): Promise<User> {
        this.logger.debug(`updateOne: order=${JSON.stringify(order)}, options=${JSON.stringify(options)}`)
        return await this.userModel.findByIdAndUpdate(order._id, { $set: order }, options)
    }

    getStrategyForPreference(strategy: Strategy): IOrderStrategy {
        return {
            ...strategy.strategy,
            strategyId: strategy._id,
        }
    }

    async create(user: CreateUserDTO) {
        const salt = await genSalt()

        const exists = await this.findByEmail(user.email)
        if (exists) throw new Error("L'email existe déjà")
        const newUser = new this.userModel({
            ...user,
            _id: new Types.ObjectId(),
            password: await hash(user.password, salt),
        })
        let account = null

        try {
            this.plateformsService.addNewTrader(newUser)
            account = await this.plateformsService.getProfile(newUser._id)

            let referrer = null
            if (user.referralCode) {
                const referrerUser = await this.findOne({ referralCode: user.referralCode }, '_id')
                if (referrerUser) {
                    referrer = referrerUser._id
                }
                delete user.referralCode
            }

            let referralUnique = false
            while (!referralUnique) {
                const referralCode = UtilService.generateReferralCode()
                const userWithReferralCode = await this.findOne({ referralCode }, '_id')
                if (!userWithReferralCode) {
                    user.referralCode = referralCode
                    referralUnique = true
                }
            }
            const strategyDefault = await this.strategyService.getDefaultStrategy()
            newUser.preferences = {
                bot: {
                    marginCoin: 'USDT',
                    automaticUpdate: false,
                    pourcentage: 4,
                    quantity: account.totalPnL,
                    strategy: this.getStrategyForPreference(strategyDefault),
                },
            }

            const newUserSave = await newUser.save()
            return newUserSave
        } catch (e) {
            this.plateformsService.removeTrader(newUser)
            throw new Error('Les informations de la clé API ne sont pas correctes')
        }
    }

    async getUsersWithSubscription(subscription: SubscriptionEnum, filter: FilterQuery<User> = {}, select?: ProjectionType<User>): Promise<User[]> {
        return await this.userModel.find({ ...filter, 'subscription.rights': subscription, 'subscription.active': true }, select).lean()
    }

    async getListOfTraders(): Promise<User[]> {
        return await this.userModel.find({ 'subscription.active': true }).lean()
    }

    async getPreferences(userId: Types.ObjectId) {
        return (await this.userModel.findById(userId, 'preferences').lean()).preferences
    }

    async setPreferences(userId: Types.ObjectId, updatePreferencesDTO: UpdatePreferencesDTO) {
        try {
            const newPreference = { ...updatePreferencesDTO }
            if (newPreference.bot?.strategy?.strategyId) {
                newPreference.bot.strategy.strategyId = new Types.ObjectId(String(updatePreferencesDTO.bot.strategy.strategyId))
            }
            await this.userModel.updateOne({ _id: userId }, { $set: { preferences: newPreference } })
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
        const { bitget, preferences, stripeCustomerId, password, ...userInfo } = user
        return {
            ...userInfo,
            rights: await this.rightService.getRights(user._id),
        }
    }

    async getOrdersStats(userId: Types.ObjectId, dateFrom: Date, dateTo: Date) {
        const filterQuery: FilterQuery<Order> = {
            userId,
            ...(dateFrom ? { createdAt: { $gte: dateFrom } } : {}),
            ...(dateTo ? { createdAt: { $lte: dateTo } } : {}),
            activated: true,
        }
        const orders = await this.orderService.getOrders(filterQuery)
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
                '5': 0,
            },
            totalPnL: 0,
            positions: [],
        }

        for (const order of orders) {
            if (order.terminated) results.nbTerminated++
            else results.nbInProgress++
            if (order.TPs) {
                const TPs = order.TPs.sort((a: TakeProfit, b: TakeProfit) => a.triggerPrice - b.triggerPrice)
                if (order.side === 'short') TPs.reverse()

                for (let i = 0; i < TPs.length; i++) {
                    if (TPs[i].activated) {
                        results.nbTotalTP++
                        results.nbTP[i]++
                        results.totalPnL += UtilService.getPnL(TPs[i].quantity, order.PE, TPs[i].triggerPrice, order.side)
                    }
                }
            }

            if (order.SL?.activated) {
                results.totalPnL += UtilService.getPnL(order.SL.quantity, order.PE, order.SL.triggerPrice, order.side)
                if (order.SL.step === -1) {
                    results.nbTotalSL++
                }
                results.nbSL[order.SL.step]++
            }
        }
        results.positions = await this.orderService.getActivePositions(userId)
        return results
    }
}
