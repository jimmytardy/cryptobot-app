import { Global, Module } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { PaymentsModule } from '../payment/payments.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Order, OrderSchema } from 'src/model/Order'
import { BitgetModule } from '../plateforms/bitget/bitget.module'
import { BitgetUtilsModule } from '../plateforms/bitget/bitget-utils/bitget-utils.module'
import { UserModule } from '../user/user.module'
import { SymbolSchema } from 'src/model/Symbol'
import { AppConfig, AppConfigSchema } from 'src/model/AppConfig'
import { BitgetFuturesModule } from '../plateforms/bitget/bitget-futures/bitget-futures.module'

@Module({
    imports: [
        PaymentsModule,
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: Symbol.name, schema: SymbolSchema },
            { name: AppConfig.name, schema: AppConfigSchema },
        ]),
        UserModule,
        BitgetModule,
        BitgetUtilsModule,
    ],
    providers: [TasksService],
    exports: [TasksService]
})
export class TasksModule {}
