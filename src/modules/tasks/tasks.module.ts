import { Module } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { PaymentsModule } from '../payment/payments.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Order, OrderSchema } from 'src/model/Order'
import { BitgetModule } from '../plateforms/bitget/bitget.module'
import { BitgetUtilsModule } from '../plateforms/bitget/bitget-utils/bitget-utils.module'
import { BitgetActionModule } from '../plateforms/bitget/bitget-action/bitget-action.module'
import { UserModule } from '../user/user.module'
import { SymbolSchema } from 'src/model/Symbol'

@Module({
    imports: [
        PaymentsModule,
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }, { name: Symbol.name, schema: SymbolSchema }]),
        UserModule,
        BitgetModule,
        BitgetActionModule,
        BitgetUtilsModule,
    ],
    providers: [TasksService],
})
export class TasksModule {}
