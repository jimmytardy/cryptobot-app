import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { PlaceOrderDTO } from './bitget.dto';
import { BitgetService } from './bitget.service';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';

@UseGuards(LocalAuthGuard)
@Controller('bitget')
export class BitgetController {

    constructor(private bitgetService: BitgetService) { }


    @Post('placeOrder')
    async placeOrder(@Body() placeOrderDTO: PlaceOrderDTO, @Request() req) {
        return await this.bitgetService.placeOrder(placeOrderDTO, req.user._id);
    }
}
