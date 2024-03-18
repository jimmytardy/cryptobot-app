import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { JwtService } from '@nestjs/jwt'
import { User } from 'src/model/User'
import * as bcrypt from 'bcrypt'
import { Types } from 'mongoose'

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<User> {
        const user = await this.userService.findByEmail(email, '+password');
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user
            return result as User;
        }
        return null
    }

    async login(user: User) {
        const payload = { email: user.email, sub: user._id }
        return {
            access_token: this.jwtService.sign(payload),
            success: true,
        }
    }

    async connectIn(userId: string, user: User = null) {
        if (!user) user = await this.userService.findById(userId)
        if (!user) throw new NotFoundException('User not found')
        const payload = { email: user.email, sub: user._id }
        return {
            access_token: this.jwtService.sign(payload),
            success: true,
        }
    }

    async connectInSubAccount(mainAccountId: Types.ObjectId, userId: string) {
        const user = await this.userService.findById(userId)
        if (!user) throw new NotFoundException('User not found')
        if (!user.mainAccountId.equals(mainAccountId)) throw new UnauthorizedException('Vous n\'êtes pas le propriétaire de ce sous compte')
        const payload = { email: user.email, sub: user._id }
        return {
            access_token: this.jwtService.sign(payload),
            success: true,
        }
    }
}
