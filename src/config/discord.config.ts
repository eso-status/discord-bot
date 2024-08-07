import {
  DiscordModuleAsyncOptions,
  DiscordModuleOption,
} from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const discordConfig: DiscordModuleAsyncOptions = {
  useFactory: (): DiscordModuleOption => ({
    token: process.env.DISCORD_TOKEN,
    discordClientOptions: {
      intents: [GatewayIntentBits.Guilds],
    },
  }),
};

export { discordConfig };
