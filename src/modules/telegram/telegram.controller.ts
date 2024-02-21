import { Body, Controller, Get, Post, Request, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RightService } from '../right/right.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('telegram')
export class TelegramController {

    constructor(private telegramService: TelegramService, private rightService: RightService, private configService: ConfigService) { }

    @Post('webhook')
    async webhook(@Body() body: any) {
        return await this.telegramService.webhook(body);
    }

    @Get('channel')
    @UseGuards(JwtAuthGuard)
    async client(@Request() req, @Res() res: Response) {
        if (!await this.rightService.checkRight(req.user._id, 'telegram')) throw new UnauthorizedException();
        console.log('co', this.configService.get<string>('TELEGRAM_CLIENT_PATH'))
        return res.sendFile(this.configService.get<string>('TELEGRAM_CLIENT_PATH'));
    }
}
