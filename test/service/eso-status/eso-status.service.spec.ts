import { Status } from '@eso-status/types';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { config } from 'dotenv';

import { AppModule } from '../../../src/app.module';
import { EsoStatusService } from '../../../src/service/eso-status/eso-status.service';

config({ quiet: true });

describe('EsoStatusService', (): void => {
  let app: INestApplicationContext;
  beforeAll(async (): Promise<void> => {
    app = await NestFactory.createApplicationContext(AppModule);
    await app.init();
  }, 15000);

  afterAll(async (): Promise<void> => {
    await app.close();
  }, 15000);

  it.each([
    { status: 'planned', icon: ':date:' },
    { status: 'down', icon: ':x:' },
    { status: 'up', icon: ':white_check_mark:' },
    { status: 'issues', icon: ':wrench:' },
    { status: '', icon: '' },
  ] as { status: Status; icon: string }[])(
    'should esoStatus connector event listen',
    (statusIcon: { status: Status; icon: string }): void => {
      const esoStatusService: EsoStatusService = app.get(EsoStatusService);

      expect(esoStatusService.getIconByStatus(statusIcon.status)).toEqual(
        statusIcon.icon,
      );
    },
    15000,
  );
});
