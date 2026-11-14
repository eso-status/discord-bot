import { NestFactory } from '@nestjs/core';

import { config } from 'dotenv';

import { AppModule } from '../../../src/app.module';

config({ quiet: true });

describe('DiscordLifecycleService (e2e)', (): void => {
  it('should stop the application when the connection to Discord fails', async (): Promise<void> => {
    const token: string = process.env.DISCORD_TOKEN;
    process.env.DISCORD_TOKEN = 'invalid-token';

    try {
      await expect(
        NestFactory.createApplicationContext(AppModule),
      ).rejects.toThrow('An invalid token was provided.');
    } finally {
      process.env.DISCORD_TOKEN = token;
    }
  }, 15000);
});
