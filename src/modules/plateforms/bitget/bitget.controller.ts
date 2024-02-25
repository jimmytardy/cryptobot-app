import { Body, Controller, Get, HttpException, Post, Put, Request, UseGuards } from '@nestjs/common';
import { PlaceOrderDTO, SetLeverageDTO } from './bitget.dto';
import { BitgetService } from './bitget.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PaymentsService } from 'src/modules/payment/payments.service';
import { SubscriptionEnum } from 'src/model/Subscription';

@UseGuards(JwtAuthGuard)
@Controller('bitget')
export class BitgetController {

    constructor(private bitgetService: BitgetService, private paymentsService: PaymentsService) { }

    @Post('placeOrder')
    async placeOrder(@Body() placeOrderDTO: PlaceOrderDTO, @Request() req) {
        if (!req.user.rights.rights.includes(SubscriptionEnum.TRADER)) throw new HttpException('Vous n\'avez pas assez de droits avec votre abonnement pour avoir cette fonctionnalité', 403);
        return await this.bitgetService.placeOrder(placeOrderDTO, req.user);
    }

    @Get('baseCoins')
    async getBaseCoins(@Request() req) {
        return await this.bitgetService.getBaseCoins(req.user._id);
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return await this.bitgetService.getProfile(req.user._id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders-active')
    async getOrders(@Request() req) {
        return this.bitgetService.getFullOrders(req.user);
    }
}
