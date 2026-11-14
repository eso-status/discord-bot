import { Slug as EsoStatusSlug } from '@eso-status/types';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import {
  ChatInputCommandInteraction,
  Client,
  InteractionReplyOptions,
} from 'discord.js';

import { config } from 'dotenv';
import { Channel } from '../../../src/resource/channel/entities/channel.entity';
import { Event } from '../../../src/resource/event/entities/event.entity';
import { Server } from '../../../src/resource/server/entities/server.entity';
import { Slug } from '../../../src/resource/slug/entities/slug.entity';
import { Subscription } from '../../../src/resource/subscription/entities/subscription.entity';
import { Repository } from 'typeorm';
import { runSeeders } from 'typeorm-extension';

import { AppModule } from '../../../src/app.module';

import { dataSource } from '../../../src/config/typeorm.config';
import { eventData } from '../../../src/database/data/event.data';
import { slugData } from '../../../src/database/data/slug.data';
import { RegisterCommand } from '../../../src/provider/register-command/register-command';
import { EventType } from '../../../src/type/event.type';

import SpyInstance = jest.SpyInstance;

config({ quiet: true });

const testCommand = async (
  client: Client,
  doOnRegister: SpyInstance<Promise<string>>,
  guildId: string,
  channelId: string,
  event: EventType = 'all' as EventType,
  slug: EsoStatusSlug = 'all' as EsoStatusSlug,
): Promise<void> => {
  const optionList: Map<string, string> = new Map<string, string>();
  if (event !== ('all' as EventType)) {
    optionList.set('event', event);
  }
  if (slug !== ('all' as EsoStatusSlug)) {
    optionList.set('slug', slug);
  }

  const replyOptions: InteractionReplyOptions =
    await new Promise<InteractionReplyOptions>(
      (resolve: (value: InteractionReplyOptions) => void): void => {
        client.emit('interactionCreate', {
          isChatInputCommand: (): boolean => true,
          channelId,
          guildId,
          commandName: 'register',
          options: {
            getString: (name: string): string | null =>
              optionList.get(name) ?? null,
          },
          reply: (options: InteractionReplyOptions): Promise<void> => {
            resolve(options);
            return Promise.resolve();
          },
        } as unknown as ChatInputCommandInteraction);
      },
    );

  expect(replyOptions.embeds).toHaveLength(1);
  expect(replyOptions.embeds[0]).toMatchObject({
    data: {
      description: 'Successfully registered!',
      footer: {
        text: 'Data from https://api.eso-status.com/v2/service',
        icon_url: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      },
    },
  });
  expect(doOnRegister).toHaveBeenCalledWith(guildId, channelId, event, slug);
};

describe('RegisterCommand (e2e)', (): void => {
  let app: INestApplicationContext;
  let registerCommand: RegisterCommand;
  let doOnRegister: SpyInstance<Promise<string>>;
  let client: Client;
  let subscriptionRepository: Repository<Subscription>;
  let channelRepository: Repository<Channel>;
  let serverRepository: Repository<Server>;

  beforeAll(async (): Promise<void> => {
    await dataSource.initialize();
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await runSeeders(dataSource);

    app = await NestFactory.createApplicationContext(AppModule);
    await app.init();

    registerCommand = app.get(RegisterCommand);
    doOnRegister = jest.spyOn(registerCommand, 'doOnRegister');
    client = app.get(Client);

    subscriptionRepository = dataSource.getRepository(Subscription);
    channelRepository = dataSource.getRepository(Channel);
    serverRepository = dataSource.getRepository(Server);
  }, 15000);

  beforeEach(async (): Promise<void> => {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await runSeeders(dataSource);
  }, 15000);

  afterAll(async (): Promise<void> => {
    await app.close();
    await client.destroy();
  }, 15000);

  it('should register with new server and new channel with single event and single slug', async (): Promise<void> => {
    expect(
      await serverRepository.count({
        where: {
          serverId: process.env.DISCORD_TESTING_GUILDID,
        },
      }),
    ).toBe(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: process.env.DISCORD_TESTING_CHANNELID,
        },
      }),
    ).toBe(0);

    await testCommand(
      client,
      doOnRegister,
      process.env.DISCORD_TESTING_GUILDID,
      process.env.DISCORD_TESTING_CHANNELID,
      'statusUpdate',
      'server_pc_eu',
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: process.env.DISCORD_TESTING_GUILDID,
      },
    });
    expect(serverList).toHaveLength(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: process.env.DISCORD_TESTING_CHANNELID,
      },
    });
    expect(channelList).toHaveLength(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList).toHaveLength(1);
    expect(subscriptionList[0].eventId).toBe(2);
    expect(subscriptionList[0].slugId).toBe(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with not new server and new channel with single event and single slug', async (): Promise<void> => {
    const server: Server = await serverRepository.save(
      serverRepository.create({
        serverId: process.env.DISCORD_TESTING_GUILDID,
      }),
    );

    await channelRepository.save(
      channelRepository.create({
        channelId: '1234',
        serverId: server.id,
      }),
    );

    expect(
      await serverRepository.count({
        where: {
          serverId: process.env.DISCORD_TESTING_GUILDID,
        },
      }),
    ).toBe(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toBe(1);

    expect(
      await channelRepository.count({
        where: {
          channelId: process.env.DISCORD_TESTING_CHANNELID,
        },
      }),
    ).toBe(0);

    await testCommand(
      client,
      doOnRegister,
      process.env.DISCORD_TESTING_GUILDID,
      process.env.DISCORD_TESTING_CHANNELID,
      'statusUpdate',
      'server_pc_eu',
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: process.env.DISCORD_TESTING_GUILDID,
      },
    });
    expect(serverList).toHaveLength(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toBe(2);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: process.env.DISCORD_TESTING_CHANNELID,
      },
    });
    expect(channelList).toHaveLength(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList).toHaveLength(1);
    expect(subscriptionList[0].eventId).toBe(2);
    expect(subscriptionList[0].slugId).toBe(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with not new server and not new channel with single event and single slug', async (): Promise<void> => {
    const server: Server = await serverRepository.save(
      serverRepository.create({
        serverId: process.env.DISCORD_TESTING_GUILDID,
      }),
    );

    const channel: Channel = await channelRepository.save(
      channelRepository.create({
        channelId: process.env.DISCORD_TESTING_CHANNELID,
        serverId: server.id,
      }),
    );

    expect(
      await serverRepository.count({
        where: {
          serverId: process.env.DISCORD_TESTING_GUILDID,
        },
      }),
    ).toBe(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toBe(1);

    expect(
      await channelRepository.count({
        where: {
          channelId: process.env.DISCORD_TESTING_CHANNELID,
        },
      }),
    ).toBe(1);

    await Promise.all(
      [
        { eventId: 3, slugId: 6 },
        { eventId: 3, slugId: 5 },
      ].map(
        (subscriptionData: {
          eventId: number;
          slugId: number;
        }): Promise<Subscription> => {
          return subscriptionRepository.save(
            subscriptionRepository.create({
              channelId: channel.id,
              eventId: subscriptionData.eventId,
              slugId: subscriptionData.slugId,
            }),
          );
        },
      ),
    );

    expect(
      await subscriptionRepository.count({
        where: {
          channelId: channel.id,
        },
      }),
    ).toBe(2);

    await testCommand(
      client,
      doOnRegister,
      process.env.DISCORD_TESTING_GUILDID,
      process.env.DISCORD_TESTING_CHANNELID,
      'statusUpdate',
      'server_pc_eu',
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: process.env.DISCORD_TESTING_GUILDID,
      },
    });
    expect(serverList).toHaveLength(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toBe(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: process.env.DISCORD_TESTING_CHANNELID,
      },
    });
    expect(channelList).toHaveLength(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList).toHaveLength(1);
    expect(subscriptionList[0].eventId).toBe(2);
    expect(subscriptionList[0].slugId).toBe(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with new server and new channel with single event and no slug', async (): Promise<void> => {
    expect(
      await serverRepository.count({
        where: {
          serverId: process.env.DISCORD_TESTING_GUILDID,
        },
      }),
    ).toBe(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: process.env.DISCORD_TESTING_CHANNELID,
        },
      }),
    ).toBe(0);

    await testCommand(
      client,
      doOnRegister,
      process.env.DISCORD_TESTING_GUILDID,
      process.env.DISCORD_TESTING_CHANNELID,
      'statusUpdate',
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: process.env.DISCORD_TESTING_GUILDID,
      },
    });
    expect(serverList).toHaveLength(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: process.env.DISCORD_TESTING_CHANNELID,
      },
    });
    expect(channelList).toHaveLength(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      select: { eventId: true, slugId: true },
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList).toHaveLength(slugData.length);

    const expectList: { eventId: number; slugId: number }[] = [];
    slugData.forEach((slug: Slug): void => {
      expectList.push({ eventId: 2, slugId: slug.id });
    });

    expectList.forEach(
      (expectData: { eventId: number; slugId: number }): void => {
        expect(JSON.stringify(subscriptionList)).toContain(
          JSON.stringify(expectData),
        );
      },
    );
  }, 15000);

  it('should register with new server and new channel with no event and no slug', async (): Promise<void> => {
    expect(
      await serverRepository.count({
        where: {
          serverId: process.env.DISCORD_TESTING_GUILDID,
        },
      }),
    ).toBe(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: process.env.DISCORD_TESTING_CHANNELID,
        },
      }),
    ).toBe(0);

    await testCommand(
      client,
      doOnRegister,
      process.env.DISCORD_TESTING_GUILDID,
      process.env.DISCORD_TESTING_CHANNELID,
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: process.env.DISCORD_TESTING_GUILDID,
      },
    });
    expect(serverList).toHaveLength(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: process.env.DISCORD_TESTING_CHANNELID,
      },
    });
    expect(channelList).toHaveLength(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      select: { eventId: true, slugId: true },
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList).toHaveLength(slugData.length * eventData.length);

    const expectList: { eventId: number; slugId: number }[] = [];
    slugData.forEach((slug: Slug): void => {
      eventData.forEach((event: Event): void => {
        expectList.push({ eventId: event.id, slugId: slug.id });
      });
    });

    expectList.forEach(
      (expectData: { eventId: number; slugId: number }): void => {
        expect(JSON.stringify(subscriptionList)).toContain(
          JSON.stringify(expectData),
        );
      },
    );
  }, 15000);
});
