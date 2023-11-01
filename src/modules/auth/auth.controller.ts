import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from 'src/guards/local-auth.guard'
import { CreateUserDTO } from '../user/user.dto'
import { UserService } from '../user/user.service'
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user)
    }
    
    @Post('signup')
    async signUp(@Body() createUserDTO: CreateUserDTO) {
        try {
            const user = await this.userService.create(createUserDTO);
            return {
              ...this.authService.login(user),
              message: 'Utilisateur crée avec succès.'
            }
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async isConnected(@Request() req) {
        return {
            user: req.user,
        }
    }
}
