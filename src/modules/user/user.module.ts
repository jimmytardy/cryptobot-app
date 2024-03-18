import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/model/User';
import { PlateformsModule } from '../plateforms/plateforms.module';
import { OrderModule } from '../order/order.module';
import { StrategyModule } from '../strategy/strategy.module';
import { Strategy, StrategySchema } from 'src/model/Stategy';
import { PaymentsModule } from '../payment/payments.module';

@Module({
  imports: [PaymentsModule, OrderModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Strategy.name, schema: StrategySchema }]), forwardRef(() => PlateformsModule), StrategyModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
