import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';

import { AppModule } from './app.module';

config();

export async function bootstrap(): Promise<INestApplication> {
  const app: INestApplication = await NestFactory.create(AppModule);

  await app.init();

  return app;
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
