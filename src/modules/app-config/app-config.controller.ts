import { Controller, Get, HttpException, Post, Req, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('app-config')
@UseGuards(JwtAuthGuard)
export class AppConfigController {

    constructor(private appConfigService: AppConfigService) {}

    @Get()
    async getConfig(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return this.appConfigService.getConfig();
    }

    @Post()
    async setConfig(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return this.appConfigService.setConfig(req.body);
    }
}
