import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { IUserPreferencesOrder, User } from 'src/model/User'
import { CreateUserDTO, UpdatePreferencesDTO } from './user.dto'
import { genSalt, hash } from 'bcrypt'
import { PlateformsService } from '../plateforms/plateforms.service'

@Injectable()
export class UserService implements OnApplicationBootstrap {
    logger: Logger
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private plateformsService: PlateformsService,
    ) {
        this.logger = new Logger('UserService')
    }

    async onApplicationBootstrap() {
        const users = await this.getListOfTraders()
        await this.plateformsService.initializeTraders(users)
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return await this.userModel.findOne({ email }).lean()
    }

    async findById(id: string): Promise<User | undefined> {
        return await this.userModel.findById(id).lean()
    }

    async create(user: CreateUserDTO) {
        const salt = await genSalt()
        const newUser = await new this.userModel({
            ...user,
            password: await hash(user.password, salt),
        }).save();
        this.plateformsService.addNewTrader(newUser)
        return newUser
    }

    async getListOfTraders(): Promise<User[]> {
        return await this.userModel.find()
    }

    async getPreferences(userId: Types.ObjectId) {
        return (await this.userModel.findById(userId, 'preferences').lean()).preferences
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
}
