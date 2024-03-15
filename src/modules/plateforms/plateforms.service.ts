import { Inject, Injectable, OnApplicationBootstrap, forwardRef } from '@nestjs/common'
import { BitgetService } from './bitget/bitget.service'
import { UserService } from '../user/user.service'
import { User } from 'src/model/User'
import { BitgetWsService } from './bitget/bitget-ws/bitget-ws.service'
import { Types } from 'mongoose'

@Injectable()
export class PlateformsService {
    constructor(
        private bitgetService: BitgetService,
        @Inject(forwardRef(() => BitgetWsService)) private bitgetWsService: BitgetWsService,
    ) {}

    async initializeTraders(users: User[]) {
        if (!users.length) return
        for (const user of users) {
            this.addNewTrader(user)
        }
    }

    addNewTrader(user: User) {
        this.bitgetService.addNewTrader(user)
        this.bitgetWsService.addNewTrader(user)
    }

    removeTrader(user: User) {
        this.bitgetService.removeTrader(user)
        this.bitgetWsService.removeTrader(user)
    }

    async getProfile(userId: Types.ObjectId) {
        return {
            bitget: await this.bitgetService.getProfile(userId),
        }
    }

    async closeAllPositions(userId: Types.ObjectId) {
        await this.bitgetService.closeAllPosition(userId);
    }
}
