import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { PlateformsModule } from './plateforms/plateforms.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PaymentsModule } from './payment/payments.module';

@Module({
  imports: [OrderModule, PlateformsModule, AuthModule, UserModule, PaymentsModule]
})
export class ModulesModule {}
