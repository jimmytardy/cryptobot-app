import { Module } from '@nestjs/common';
import { BitgetUtilsService } from './bitget-utils.service';

@Module({
    imports: [BitgetUtilsModule],
    providers: [BitgetUtilsService],
    exports: [BitgetUtilsService]
})
export class BitgetUtilsModule {}
