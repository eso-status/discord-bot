import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Client } from 'discord.js';

@Injectable()
export class DiscordLifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(private readonly client: Client) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.client.destroy();
  }
}
