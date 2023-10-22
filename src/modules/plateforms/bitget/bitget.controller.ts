import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { PlaceOrderDTO } from './bitget.dto';
import { BitgetService } from './bitget.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bitget')
export class BitgetController {

    constructor(private bitgetService: BitgetService) { }

    @Post('placeOrder')
    async placeOrder(@Body() placeOrderDTO: PlaceOrderDTO, @Request() req) {
        return await this.bitgetService.placeOrder(placeOrderDTO, req.user._id);
    }

    @Get('baseCoins')
    async getBaseCoins(@Request() req) {
        return await this.bitgetService.getBaseCoins(req.user._id);
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return await this.bitgetService.getProfile(req.user._id);
    }
}
