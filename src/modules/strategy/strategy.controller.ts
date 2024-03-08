import { Body, Controller, Get, HttpException, Post, Req, UseGuards } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('strategy')
@UseGuards(JwtAuthGuard)
export class StrategyController {
    constructor(private strategyService: StrategyService) { }

    @Get()
    async getStrategies(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.strategyService.findAll()
    }

    @Post()
    async createStrategy(@Req() req, @Body() body: any) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return await this.strategyService.findAndUpdateOne(body)
    }
}
