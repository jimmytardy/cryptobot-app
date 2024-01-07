import { Module } from '@nestjs/common'
import { BitgetController } from './bitget.controller'
import { BitgetService } from './bitget.service'
import { BitgetActionModule } from './bitget-action/bitget-action.module'
import { BitgetUtilsModule } from './bitget-utils/bitget-utils.module'
import { BitgetWsModule } from './bitget-ws/bitget-ws.module'
import { OrderModule } from 'src/modules/order/order.module'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/model/User'
import { PaymentsModule } from 'src/modules/payment/payments.module'
import { AppConfigModule } from 'src/modules/app-config/app-config.module'

@Module({
    imports: [
        BitgetActionModule,
        BitgetUtilsModule,
        BitgetWsModule,
        OrderModule,
        PaymentsModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [BitgetController],
    providers: [BitgetService],
    exports: [BitgetService],
})
export class BitgetModule {}
