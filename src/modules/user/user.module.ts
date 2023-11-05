import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/model/User';
import { PlateformsModule } from '../plateforms/plateforms.module';
import { OrderModule } from '../order/order.module';
import { PaymentsModule } from '../payment/payments.module';

@Module({
  imports: [OrderModule, PaymentsModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), PlateformsModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
