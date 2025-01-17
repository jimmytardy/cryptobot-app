import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  if (app.get(ConfigService).get<string>('ENV') !== 'DEV')  app.useLogger(['error', 'warn', 'log']);
  app.useLogger(['error', 'warn', 'log'])
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({transform: true}));
  await app.listen(app.get(ConfigService).get<string>('port'));  
}
bootstrap();
 