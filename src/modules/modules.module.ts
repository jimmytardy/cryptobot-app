import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { PlateformsModule } from './plateforms/plateforms.module';

@Module({
  imports: [OrderModule, PlateformsModule]
})
export class ModulesModule {}
