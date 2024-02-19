import { Module, forwardRef } from '@nestjs/common'
import { BitgetWsService } from './bitget-ws.service'
import { BitgetModule } from '../bitget.module'
import { OrderModule } from 'src/modules/order/order.module'
import { UserModule } from 'src/modules/user/user.module'
import { StopLossModule } from 'src/modules/order/stop-loss/stop-loss.module'
import { TakeProfitModule } from 'src/modules/order/take-profit/take-profit.module'
import { PositionModule } from 'src/modules/position/position.module'

@Module({
    imports: [
        OrderModule,
        StopLossModule,
        TakeProfitModule,
        PositionModule,
        forwardRef(() => BitgetModule),
        UserModule
    ],
    providers: [BitgetWsService],
    exports: [BitgetWsService],
})
export class BitgetWsModule {}
