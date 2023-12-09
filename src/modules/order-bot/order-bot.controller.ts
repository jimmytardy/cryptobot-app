import { Body, Controller, Delete, Get, HttpException, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OrderBotService } from './order-bot.service';
import { SetOrderBotDTO } from './order-bot.dto';

@Controller('order-bot')
@UseGuards(JwtAuthGuard)
export class OrderBotController {
    logger: Logger = new Logger('OrderBotController');

    constructor(private orderBotService: OrderBotService) { }
    
    @Get()
    getOrderBots(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return this.orderBotService.getOrderBots();
    }

    @Get(':orderId')
    getOrderBot(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        return this.orderBotService.findById(orderId);
    }

    @Post(':orderId')
    async setOrderBot(@Req() req, @Param('orderId') orderId: string, @Body() body: SetOrderBotDTO) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        const message = await this.orderBotService.setOrder(orderId, body);

        return { message: message }
    }

    @Delete(':orderId')
    async deleteOrderBot(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        await this.orderBotService.deleteOrderBot(orderId);

        return { status: true };
    }
}
