import { Module } from '@nestjs/common';
import { BitgetModule } from './bitget/bitget.module';

@Module({
    imports: [BitgetModule],
})
export class PlateformsModule {}
