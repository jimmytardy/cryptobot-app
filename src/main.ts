import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { WebsocketClient } from 'bitget-api';
import { BitgetWsService } from './bitget/bitget-ws/bitget-ws.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(app.get(ConfigService).get<string>('port'));  
}
bootstrap();
