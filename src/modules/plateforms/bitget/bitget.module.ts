import { Module } from '@nestjs/common';
import { BitgetController } from './bitget.controller';
import { BitgetService } from './bitget.service';
import { BitgetActionService } from './bitget-action/bitget-action.service';
import { BitgetUtilsService } from './bitget-utils/bitget-utils.service';
import { BitgetActionModule } from './bitget-action/bitget-action.module';
import { BitgetUtilsModule } from './bitget-utils/bitget-utils.module';
import { ConfigModule } from '@nestjs/config';
import { BitgetWsModule } from './bitget-ws/bitget-ws.module';
import { OrderModule } from 'src/modules/order/order.module';

@Module({
  imports: [BitgetActionModule, BitgetUtilsModule, ConfigModule, BitgetWsModule, OrderModule],
  controllers: [BitgetController],
  providers: [BitgetService],
  exports: [BitgetService],
})
export class BitgetModule {}
