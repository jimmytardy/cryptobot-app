import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Put, Query, Req, Request, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/model/User';
import { CreateSubAccountDTO, CreateUserDTO, ProfileUpdateDTO, UpdatePreferencesDTO, UserStatsDTO } from './user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OrderService } from '../order/order.service';
import { Strategy } from 'src/model/Stategy';
import { SubscriptionEnum } from 'src/model/Subscription';

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
        if (!(req.user as User).subscription?.rights?.includes(SubscriptionEnum.BOT) || !(req.user as User).subscription?.active) {
            throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        }
        return await this.userService.findAll({ mainAccountId: req.user._id }, 'email active numAccount createdAt preferences.bot.quantity preferences.bot.pourcentage preferences.bot.strategy.strategyId', { populate: { path: 'preferences.bot.strategy.strategyId', select: 'name', model: this.strategyModel } });
    }

    @UseGuards(JwtAuthGuard)
    @Post('sub-account')
    async createSubAccounts(@Req() req, @Body() subAccountDTO: CreateSubAccountDTO) {
        if (!(req.user as User).subscription?.rights?.includes(SubscriptionEnum.BOT) || !(req.user as User).subscription?.active) {
            throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        }
        try {
            return await this.userService.createSubAccount(req.user._id, subAccountDTO);
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('sub-account/:id([0-9a-f]{24})')
    async deleteSubAccounts(@Req() req, @Param('id') subAccountId: string, @Query() query: { deletePositionInProgress?: string }) {
        if (!(req.user as User).subscription?.rights?.includes(SubscriptionEnum.BOT) || !(req.user as User).subscription?.active) {
            throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        }
        try {
            return await this.userService.deleteSubAccount(new Types.ObjectId(subAccountId), query);
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch('sub-account/:id([0-9a-f]{24})')
    async reactivateSubAccount(@Req() req, @Param('id') subAccountId: string) {
        if (!(req.user as User).subscription?.rights?.includes(SubscriptionEnum.BOT) || !(req.user as User).subscription?.active) {
            throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        }
        try {
            return await this.userService.reactivateSubAccount(new Types.ObjectId(subAccountId));
        } catch (e) {
            throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('sub-accounts/profile')
    async getSubAccountsProfile(@Request() req) {
        if (!(req.user as User).subscription?.rights?.includes(SubscriptionEnum.BOT) || !(req.user as User).subscription?.active) {
            throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        }
        return await this.userService.getSubAccountsProfile(req.user._id);
    }
}
