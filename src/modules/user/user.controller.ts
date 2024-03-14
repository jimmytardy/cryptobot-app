import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, Request, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/model/User';
import { CreateSubAccountDTO, CreateUserDTO, ProfileUpdateDTO, UpdatePreferencesDTO, UserStatsDTO } from './user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OrderService } from '../order/order.service';
import { Strategy } from 'src/model/Stategy';

@Controller('user')
export class UserController {

    constructor(private userService: UserService, @InjectModel(Strategy.name) private strategyModel: Model<Strategy>) { }

    @Post()
    async create(@Body() userDTO: CreateUserDTO) {
        return this.userService.create(userDTO);
    }

    @Get('referral/:referralCode')
    async get(@Param('referralCode') referralCode: string) {
        return await this.userService.findOne({ referralCode, 'subscription.active': true, 'subscription.status': 'active', active: true }, 'email firstname lastname');
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
    @Get('stats')
    async getStats(@Request() req, @Query() query: UserStatsDTO) {
        return await this.userService.getOrdersStats(req.user._id, query.dateFrom, query.dateTo);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/users')
    async getUsers(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.userService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('sub-accounts')
    async getSubAccounts(@Req() req) {
        return await this.userService.findAll({ mainAccountId: req.user._id }, 'email numAccount createdAt preferences.bot.quantity preferences.bot.pourcentage preferences.bot.strategy.strategyId', { populate: { path: 'preferences.bot.strategy.strategyId', select: 'name', model: this.strategyModel } });
    }

    @UseGuards(JwtAuthGuard)
    @Post('sub-account')
    async createSubAccounts(@Req() req, @Body() subAccountDTO: CreateSubAccountDTO) {
        try {
            return await this.userService.createSubAccount(req.user._id, subAccountDTO);
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }
}
