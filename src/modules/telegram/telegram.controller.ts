import { Body, Controller, Get, Post, Request, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { RightService } from '../right/right.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { JwtTelegramAuthGuard } from 'src/guards/jwt-telegram-auth';
import { RightEnum } from 'src/model/Right';
import { join } from 'path';

@Controller('telegram')
export class TelegramController {

    constructor(private telegramService: TelegramService, private rightService: RightService, private configService: ConfigService) { }

    @Post('webhook')
    async webhook(@Body() body: any) {
        return await this.telegramService.webhook(body);
    }
}
