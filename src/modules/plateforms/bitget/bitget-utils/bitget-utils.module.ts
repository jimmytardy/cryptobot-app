import { Module } from '@nestjs/common';
import { BitgetUtilsService } from './bitget-utils.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/model/User';
import { OrderModule } from 'src/modules/order/order.module';
import { SymbolSchema } from 'src/model/Symbol';

@Module({
    imports: [BitgetUtilsModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Symbol.name, schema: SymbolSchema }])],
    providers: [BitgetUtilsService],
    exports: [BitgetUtilsService]
})
export class BitgetUtilsModule {}
