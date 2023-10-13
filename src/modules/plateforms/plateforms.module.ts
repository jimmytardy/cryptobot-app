import { Module } from '@nestjs/common';
import { BitgetModule } from './bitget/bitget.module';
import { UserModule } from '../user/user.module';
import { PlateformsService } from './plateforms.service';
import { BitgetWsModule } from './bitget/bitget-ws/bitget-ws.module';

@Module({
    imports: [BitgetModule, BitgetWsModule],
    providers: [PlateformsService],
    exports: [PlateformsService]
})
export class PlateformsModule {}
