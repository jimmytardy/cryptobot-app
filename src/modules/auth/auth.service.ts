import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { JwtService } from '@nestjs/jwt'
import { User } from 'src/model/User'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {}

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

    async connectIn(userId: string) {
        const user = await this.userService.findById(userId)
        if (!user) throw new NotFoundException('User not found')
        const payload = { email: user.email, sub: user._id }
        return {
            access_token: this.jwtService.sign(payload),
            success: true,
        }
    }
}
