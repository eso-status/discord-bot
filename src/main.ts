import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

export async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  await app.init();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
