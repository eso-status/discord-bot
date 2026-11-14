import { FactoryProvider } from '@nestjs/common';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config({ quiet: true });

const discordClientProvider: FactoryProvider<Client> = {
  provide: Client,
  useFactory: (): Client =>
    new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    }),
};

export { discordClientProvider };
