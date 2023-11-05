import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard'
import { PaymentsService } from './payments.service'

@Controller('payment')
export class PaymentsController {
    constructor(private payementService: PaymentsService) {}

    @Post('webhook/stripe')
    async webhookStripe(@Body() body: any) {
        const event = body
        return await this.payementService.webhookStripe(event)
    }

    @Post('stripe/create-customer-portal-session')
    @UseGuards(JwtAuthGuard)
    async createCustomerPortalSession(@Req() req) {
        console.log(' req.get(origin),',  req.get('origin'),)
        const session = await this.payementService.createCustomerPortalSession(
            req.user,
            req.get('origin'),
        )
        return {
            url: session,
        }
    }
}
