import EventEmitter from 'events';

import { EsoStatusConnector } from '@eso-status/connector';
import {
  EsoStatus,
  MaintenanceEsoStatus,
  Slug as EsoStatusSlug,
} from '@eso-status/types';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { Client, Embed, Events, Message } from 'discord.js';

import { config } from 'dotenv';
import moment from 'moment';
import { Repository } from 'typeorm';
import { runSeeders } from 'typeorm-extension';

import { AppModule } from '../../../src/app.module';

import { dataSource } from '../../../src/config/typeorm.config';
import { eventData } from '../../../src/database/data/event.data';
import { slugData } from '../../../src/database/data/slug.data';
import { Channel } from '../../../src/resource/channel/entities/channel.entity';
import { Event } from '../../../src/resource/event/entities/event.entity';
import { Server } from '../../../src/resource/server/entities/server.entity';
import { Slug } from '../../../src/resource/slug/entities/slug.entity';

import { Subscription } from '../../../src/resource/subscription/entities/subscription.entity';
import { EsoStatusService } from '../../../src/service/eso-status/eso-status.service';
import { EventType } from '../../../src/type/event.type';

import SpyInstance = jest.SpyInstance;

config({ quiet: true });

type EsoStatusEventData = EsoStatus | MaintenanceEsoStatus | EsoStatusSlug;

const testEsoStatusEvent = (
  client: Client,
  app: INestApplicationContext,
  esoStatusServer: EventEmitter,
  resolve: (value?: void | PromiseLike<void>) => void,
  event: EventType,
  message: Embed,
  data?: EsoStatusEventData,
): void => {
  const method: SpyInstance<Promise<void>> = jest.spyOn(
    app.get(EsoStatusService),
    event,
  );

  let dataOk = false;

  client.on('messageCreate', (messageData: Message): void => {
    if (
      messageData.embeds[0].data.title === message.data.title &&
      messageData.embeds[0].data.description === message.data.description &&
      messageData.embeds[0].data.footer.text === message.data.footer.text &&
      messageData.embeds[0].data.footer.icon_url ===
        message.data.footer.icon_url
    ) {
      dataOk = true;
    }
  });

  esoStatusServer.emit(event, data);

  setTimeout((): void => {
    if (dataOk) {
      expect(method).toHaveBeenCalledWith(
        ...(data === undefined ? [] : [data]),
      );
      resolve();
    }
  }, 10000);
};

describe('EsoStatusService (e2e)', (): void => {
  let app: INestApplicationContext;
  let client: Client;
  let esoStatusServer: EventEmitter;
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

    client = app.get(Client);
    esoStatusServer = new EventEmitter();
    jest
      .spyOn(EsoStatusConnector, 'listen')
      .mockImplementation((): EventEmitter => esoStatusServer);

    subscriptionRepository = dataSource.getRepository(Subscription);
    channelRepository = dataSource.getRepository(Channel);
    serverRepository = dataSource.getRepository(Server);
  }, 15000);

  beforeEach(async (): Promise<void> => {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await runSeeders(dataSource);

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

    const subscriptionDataList: { eventId: number; slugId: number }[] = [];
    slugData.forEach((slug: Slug): void => {
      eventData.forEach((event: Event): void => {
        subscriptionDataList.push({ eventId: event.id, slugId: slug.id });
      });
    });

    await Promise.all(
      subscriptionDataList.map(
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
  }, 15000);

  afterAll(async (): Promise<void> => {
    await app.close();
    await client.destroy();
  }, 15000);

  it.each([
    {
      event: 'maintenancePlanned',
      message: {
        data: {
          title: 'New maintenance planned!',
          description:
            '• PC/Mac: NA and EU megaservers for patch maintenance – July 29, 4:00AM EDT (8:00 UTC) – 8:00AM EDT (12:00 UTC)',
          footer: {
            text: 'Data from https://api.eso-status.com/v2/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
      data: {
        raw: {
          sources: ['https://forums.elderscrollsonline.com/'],
          raw: [
            '• PC/Mac: NA and EU megaservers for patch maintenance – July 29, 4:00AM EDT (8:00 UTC) – 8:00AM EDT (12:00 UTC)',
          ],
          slugs: ['server_pc_na'],
          rawDate: 'July 29, 4:00AM EDT (8:00 UTC) – 8:00AM EDT (12:00 UTC)',
          dates: [
            moment()
              .utc()
              .set('years', 2024)
              .set('months', 7)
              .set('date', 29)
              .set('hours', 8)
              .set('minutes', 0)
              .set('seconds', 0)
              .set('milliseconds', 0)
              .utcOffset(0),
            moment()
              .utc()
              .set('years', 2024)
              .set('months', 7)
              .set('date', 29)
              .set('hours', 12)
              .set('minutes', 0)
              .set('seconds', 0)
              .set('milliseconds', 0)
              .utcOffset(0),
          ],
          type: 'server',
          support: 'pc',
          zone: 'na',
          status: 'planned',
        },
        slug: 'server_pc_na',
        beginnerAt: moment()
          .utc()
          .set('years', 2024)
          .set('months', 7)
          .set('date', 29)
          .set('hours', 8)
          .set('minutes', 0)
          .set('seconds', 0)
          .set('milliseconds', 0)
          .utcOffset(0)
          .toISOString(),
        endingAt: moment()
          .utc()
          .set('years', 2024)
          .set('months', 7)
          .set('date', 29)
          .set('hours', 12)
          .set('minutes', 0)
          .set('seconds', 0)
          .set('milliseconds', 0)
          .utcOffset(0)
          .toISOString(),
      },
    },
    {
      event: 'statusUpdate',
      message: {
        data: {
          title: 'Eso Status service status changed!',
          description: '**PC-EU** => :white_check_mark:',
          footer: {
            text: 'Data from https://api.eso-status.com/v2/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
      data: {
        slug: 'server_pc_eu',
        status: 'up',
        type: 'server',
        support: 'pc',
        zone: 'eu',
        raw: {
          sources: [
            'https://live-services.elderscrollsonline.com/status/realms',
          ],
          raw: ['The Elder Scrolls Online (EU)', 'UP'],
          rawSlug: 'The Elder Scrolls Online (EU)',
          rawStatus: 'UP',
          slugs: ['server_pc_eu'],
          support: 'pc',
          zone: 'eu',
          status: 'up',
        },
      },
    },
    {
      event: 'disconnect',
      message: {
        data: {
          description: 'Eso status API disconnected!',
          footer: {
            text: 'Data from https://api.eso-status.com/v2/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
    },
    {
      event: 'reconnect',
      message: {
        data: {
          description: 'Eso status API reconnected!',
          footer: {
            text: 'Data from https://api.eso-status.com/v2/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
    },
    {
      event: 'connected',
      message: {
        data: {
          description: 'Eso status API connected!',
          footer: {
            text: 'Data from https://api.eso-status.com/v2/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
    },
  ] as {
    event: EventType;
    message?: Embed;
    data?: EsoStatus | MaintenanceEsoStatus | EsoStatusSlug;
  }[])(
    'should esoStatus connector event listen',
    async (event: {
      event: EventType;
      message?: Embed;
      data?: EsoStatus | MaintenanceEsoStatus | EsoStatusSlug;
    }): Promise<void> => {
      await new Promise<void>(
        (resolve: (value?: void | PromiseLike<void>) => void): void => {
          if (client.isReady()) {
            testEsoStatusEvent(
              client,
              app,
              esoStatusServer,
              resolve,
              event.event,
              event.message,
              event.data,
            );
          }

          client.on(Events.ClientReady, (): void => {
            testEsoStatusEvent(
              client,
              app,
              esoStatusServer,
              resolve,
              event.event,
              event.message,
              event.data,
            );
          });
        },
      );
    },
    15000,
  );
});
