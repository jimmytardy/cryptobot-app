import { Module } from '@nestjs/common';
import { BitgetUtilsService } from './bitget-utils.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/model/User';
import { OrderModule } from 'src/modules/order/order.module';

@Module({
    imports: [BitgetUtilsModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    providers: [BitgetUtilsService],
    exports: [BitgetUtilsService]
})
export class BitgetUtilsModule {}
