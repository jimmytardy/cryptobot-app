import { Module } from '@nestjs/common'
import { BitgetUtilsModule } from '../bitget-utils/bitget-utils.module'
import { BitgetActionService } from './bitget-action.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Order, OrderSchema } from 'src/model/Order'
import { TakeProfit, TakeProfitSchema } from 'src/model/TakeProfit'
import { StopLoss, StopLossSchema } from 'src/model/StopLoss'
import { OrderModule } from 'src/modules/order/order.module'
import { User, UserSchema } from 'src/model/User'
import { UserService } from 'src/modules/user/user.service'

@Module({
    imports: [
        OrderModule,
        BitgetUtilsModule,
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: TakeProfit.name, schema: TakeProfitSchema },
            { name: StopLoss.name, schema: StopLossSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    providers: [BitgetActionService],
    exports: [BitgetActionService],
})
export class BitgetActionModule {}
