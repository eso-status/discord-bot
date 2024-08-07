import { Status } from '@eso-status/types';
import { INestApplication } from '@nestjs/common';

import { config } from 'dotenv';

import { bootstrap } from '../../../src/main';
import { EsoStatusService } from '../../../src/service/eso-status/eso-status.service';

config();

describe('EsoStatusService', (): void => {
  let app: INestApplication;
  beforeAll(async (): Promise<void> => {
    app = await bootstrap();
  });

  afterAll(async (): Promise<void> => {
    await app.close();
  });

  it.each(<{ status: Status; icon: string }[]>[
    { status: 'planned', icon: ':date:' },
    { status: 'down', icon: ':x:' },
    { status: 'up', icon: ':white_check_mark:' },
    { status: 'issues', icon: ':wrench:' },
    { status: '', icon: '' },
  ])(
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
