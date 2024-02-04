import { Global, Module } from '@nestjs/common';
import { ErrorTraceService } from './error-trace.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ErrorTrace, ErrorTraceSchema } from 'src/model/ErrorTrace';
import { ErrorTraceController } from './error-trace.controller';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: ErrorTrace.name, schema: ErrorTraceSchema }])],
  providers: [ErrorTraceService],
  exports: [ErrorTraceService],
  controllers: [ErrorTraceController],
})
export class ErrorTraceModule {}
