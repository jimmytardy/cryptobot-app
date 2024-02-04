import { Module } from '@nestjs/common';
import { BitgetFuturesService } from './bitget-futures.service';
import { OrderModule } from 'src/modules/order/order.module';
import { StopLossModule } from 'src/modules/order/stop-loss/stop-loss.module';
import { TakeProfitModule } from 'src/modules/order/take-profit/take-profit.module';
import { BitgetUtilsModule } from '../bitget-utils/bitget-utils.module';
import { ErrorTraceModule } from 'src/modules/error-trace/error-trace.module';

@Module({
  imports: [BitgetUtilsModule, OrderModule, StopLossModule, TakeProfitModule, ErrorTraceModule],
  providers: [BitgetFuturesService],
  exports: [BitgetFuturesService],
})
export class BitgetFuturesModule {}
