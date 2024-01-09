import { Body, Controller, Get, HttpException, Post, Put, Query, Req, Request, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/model/User';
import { CreateUserDTO, ProfileUpdateDTO, UpdatePreferencesDTO, UserStatsDTO } from './user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OrderService } from '../order/order.service';

@Controller('user')
export class UserController {

    constructor (private userService: UserService, private orderService: OrderService) {}

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

    @UseGuards(JwtAuthGuard)
    @Get('orders-active')
    async getOrders(@Request() req) {
        return this.orderService.getFullOrders(req.user, {
            userId: req.user._id,
            activated: true,
            terminated: false,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async setProfile(@Request() req, @Body() body: ProfileUpdateDTO) {
        return await this.userService.setProfile(req.user._id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        return await this.userService.getProfile(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get('subscriptions')
    async getSubscriptions(@Request() req) {
        return await this.userService.getSubscriptions(req.user._id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    async getStats(@Request() req, @Query() query: UserStatsDTO) {
        return await this.userService.getOrdersStats(req.user._id, query.dateFrom, query.dateTo);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/users')
    async getUsers(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.userService.getFullUsersForAdmin();
    }
}
