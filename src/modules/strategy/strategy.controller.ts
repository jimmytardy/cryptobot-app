import { Body, Controller, Get, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('strategy')
@UseGuards(JwtAuthGuard)
export class StrategyController {
    constructor(private strategyService: StrategyService) { }

    @Get('admin')
    async getAdminStrategies(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.strategyService.findAll()
    }

    @Get()
    async getActiveStrategy(@Req() req) {
        return await this.strategyService.findAll({ active: true })
    }

    @Get(':id([0-9a-f]{24})')
    async getStrategy(@Req() req, @Param('id') id) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.strategyService.findOne({ _id: id })
    }

    @Post('new')
    async newStrategy(@Req() req, @Body() body: any) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.strategyService.create(body)
    }

    @Post(':id([0-9a-f]{24})')
    async updateStrategy(@Req() req, @Param('id') id, @Body() body: any) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        body._id = new Types.ObjectId(id)
        return await this.strategyService.findAndUpdateOne(body)
    }
}
