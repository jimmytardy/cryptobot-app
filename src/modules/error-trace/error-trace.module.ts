import { Global, Module } from '@nestjs/common';
import { ErrorTraceService } from './error-trace.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ErrorTrace, ErrorTraceSchema } from 'src/model/ErrorTrace';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: ErrorTrace.name, schema: ErrorTraceSchema }])],
  providers: [ErrorTraceService],
  exports: [ErrorTraceService],
})
export class ErrorTraceModule {}
