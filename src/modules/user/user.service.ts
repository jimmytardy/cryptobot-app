import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from 'src/model/User'
import { CreateUserDTO } from './user.dto'
import { genSalt, hash } from 'bcrypt'
import { PlateformsService } from '../plateforms/plateforms.service'

@Injectable()
export class UserService implements OnApplicationBootstrap {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private plateformsService: PlateformsService,
    ) {}

    async onApplicationBootstrap() {
        const users = await this.getListOfTraders()
        await this.plateformsService.initializeTraders(users)
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return await this.userModel.findOne({ email })
    }

    async findById(id: string): Promise<User | undefined> {
        return await this.userModel.findById(id)
    }

    async create(user: CreateUserDTO) {
        const salt = await genSalt()
        const newUser = await new this.userModel({
            ...user,
            password: await hash(user.password, salt),
        }).save()
        this.plateformsService.addNewTrader(newUser)
        return newUser
    }

    async getListOfTraders(): Promise<User[]> {
        return await this.userModel.find();
    }
}
