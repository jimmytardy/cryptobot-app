import { Body, Controller, Post } from '@nestjs/common';
import { PlaceOrderDTO } from './bitget.dto';
import { BitgetService } from './bitget.service';

@Controller('bitget')
export class BitgetController {

    constructor(private bitgetService: BitgetService) { }


    @Post('placeOrder')
    async placeOrder(@Body() placeOrderDTO: PlaceOrderDTO) {
        return await this.bitgetService.placeOrder(placeOrderDTO);
    }
}
