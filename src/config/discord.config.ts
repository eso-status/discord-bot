import { DiscordModuleAsyncOptions } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const discordConfig: DiscordModuleAsyncOptions = {
  useFactory: () => ({
    token: process.env.DISCORD_TOKEN,
    discordClientOptions: {
      intents: [GatewayIntentBits.Guilds],
    },
  }),
};

export { discordConfig };
