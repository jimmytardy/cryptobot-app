import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/model/User';
import { CreateUserDTO, UpdateConfigDTO } from './user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('user')
export class UserController {

    constructor (private userService: UserService) {}

    @Post()
    async create(@Body() userDTO: CreateUserDTO) {
        return this.userService.create(userDTO);
    }

    @UseGuards(JwtAuthGuard)
    @Post('config')
    async updateConfig(@Request() req, @Body() configDTO: UpdateConfigDTO) {
        return this.userService.updateConfig(req.user._id, configDTO);
    }
}
