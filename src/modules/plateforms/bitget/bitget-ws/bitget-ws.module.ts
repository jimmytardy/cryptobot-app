import { Module, forwardRef } from '@nestjs/common'
import { BitgetWsService } from './bitget-ws.service'
import { BitgetModule } from '../bitget.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Order, OrderSchema } from 'src/model/Order'
import { TakeProfit, TakeProfitSchema } from 'src/model/TakeProfit'
import { OrderModule } from 'src/modules/order/order.module'
import { UserModule } from 'src/modules/user/user.module'
import { StopLoss, StopLossSchema } from 'src/model/StopLoss'
import { User, UserSchema } from 'src/model/User'

@Module({
    imports: [
        OrderModule,
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: TakeProfit.name, schema: TakeProfitSchema },
            { name: StopLoss.name, schema: StopLossSchema },
            { name: User.name, schema: UserSchema },
        ]),
        forwardRef(() => BitgetModule),
    ],
    providers: [BitgetWsService],
    exports: [BitgetWsService],
})
export class BitgetWsModule {}
