import { Body, Controller, Delete, Get, HttpException, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { OrderBotService } from './order-bot.service';
import { NewOrderBotDTO, SetOrderBotDTO } from './order-bot.dto';
import { Types } from 'mongoose';
import { OrderBot } from 'src/model/OrderBot';

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

    @Post('new')
    async newOrderBot(@Req() req, @Body() body: NewOrderBotDTO) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);

        const orderBot: OrderBot = {
            ...body,
            _id: new Types.ObjectId(),
            linkOrderId: new Types.ObjectId(),
            deleted: false,
        }

        const message = await this.orderBotService.createOrderBot(orderBot);
        return { message: message }
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

    @Put(':orderId')
    async resumeOrderBot(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        const message = await this.orderBotService.resumeOrderBot(orderId);

        return { message: message }
    }

    @Delete(':orderId')
    async deleteOrderBot(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour accéder à cette ressource', 403);
        await this.orderBotService.deleteOrderBot(orderId);

        return { status: true };
    }

    @Post('close-position/:orderId')
    async closeForcePosition(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour cette action', 403);
        return await this.orderBotService.closeForcePosition(orderId);
    }

    @Post('synchronize-all-sl/:orderId')
    async synchronzeAllSLOrderBot(@Req() req, @Param('orderId') orderId: string) {
        if (!req.user.isAdmin) throw new HttpException('Vous n\'avez pas les droits pour cette action', 403);
        return await this.orderBotService.synchronizePositionOrderBot(orderId);
    }
}
