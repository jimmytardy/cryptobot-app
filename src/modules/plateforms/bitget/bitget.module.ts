import { Module } from '@nestjs/common'
import { BitgetController } from './bitget.controller'
import { BitgetService } from './bitget.service'
import { BitgetActionModule } from './bitget-action/bitget-action.module'
import { BitgetUtilsModule } from './bitget-utils/bitget-utils.module'
import { BitgetWsModule } from './bitget-ws/bitget-ws.module'
import { OrderModule } from 'src/modules/order/order.module'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/model/User'

@Module({
    imports: [
        BitgetActionModule,
        BitgetUtilsModule,
        BitgetWsModule,
        OrderModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [BitgetController],
    providers: [BitgetService],
    exports: [BitgetService],
})
export class BitgetModule {}
