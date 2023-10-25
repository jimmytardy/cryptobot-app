import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/model/User';
import { CreateUserDTO, UpdatePreferencesDTO } from './user.dto';
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
    @Get('preferences')
    async getPreferences(@Request() req) {
        return this.userService.getPreferences(req.user._id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('preferences')
    async setPreferences(@Request() req, @Body() preferences: UpdatePreferencesDTO) {
        return this.userService.setPreferences(req.user._id, preferences);
    }
}
