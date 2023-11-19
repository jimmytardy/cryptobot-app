import { Body, Controller, Get, HttpException, Post, Put, Request, UseGuards } from '@nestjs/common';
import { PlaceOrderDTO, SetLeverageDTO } from './bitget.dto';
import { BitgetService } from './bitget.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bitget')
export class BitgetController {

    constructor(private bitgetService: BitgetService) { }

    @Post('placeOrder')
    async placeOrder(@Body() placeOrderDTO: PlaceOrderDTO, @Request() req) {
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

    @Post('leverage')
    async setLeverage(@Request() req, @Body() body: SetLeverageDTO) {
        return await this.bitgetService.setLeverage(req.user, body);
    }
}
