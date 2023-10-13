import { Controller, Get, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @UseGuards(JwtAuthGuard)
    @Get('/test-auth')
    test_auth(): string {
        return this.appService.getHello()
    }

    @Get('/test')
    get(): string {
        return this.appService.getHello()
    }
}
