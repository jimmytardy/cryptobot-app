import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {

    constructor(private telegramService: TelegramService) { }

    @Post('webhook')
    async webhook(@Body() body: any) {
        return await this.telegramService.webhook(body);
    }
}
