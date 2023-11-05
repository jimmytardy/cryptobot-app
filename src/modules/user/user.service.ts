import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType, Types } from 'mongoose'
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

@Injectable()
export class UserService implements OnApplicationBootstrap {
    logger: Logger
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private plateformsService: PlateformsService,
        private paymentService: PaymentsService,
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
}
