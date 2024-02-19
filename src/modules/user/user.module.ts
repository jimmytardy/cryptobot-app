import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/model/User';
import { PlateformsModule } from '../plateforms/plateforms.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), forwardRef(() => PlateformsModule)],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
