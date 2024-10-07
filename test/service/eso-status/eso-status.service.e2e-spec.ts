import * as EventEmitter from 'events';

import { EventType } from '@discord-nestjs/core/dist/definitions/types/event.type';
import { ClientService } from '@discord-nestjs/core/dist/services/client.service';
import { EsoStatusConnector } from '@eso-status/connector';
import EsoStatus, {
  EsoStatusMaintenance,
  EuZone,
  NaZone,
  PcSupport,
  PlannedStatus,
  PtsZone,
  ServerPcEuSlug,
  ServerPcNaSlug,
  ServerPcPtsSlug,
  ServerType,
  Slug as EsoStatusSlug,
  UpStatus,
} from '@eso-status/types';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { Client, Embed, Message } from 'discord.js';

import { config } from 'dotenv';
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

import SpyInstance = jest.SpyInstance;

config();

const testEsoStatusEvent = (
  client: Client,
  app: INestApplication,
  esoStatusServer: EventEmitter,
  resolve: (value?: void | PromiseLike<void>) => void,
  event: EventType,
  message: Embed,
  data?: EsoStatus | EsoStatusMaintenance | EsoStatusSlug,
): void => {
  const method: SpyInstance<Promise<void>> = jest.spyOn(
    app.get(EsoStatusService),
    // @ts-expect-error Necessary to get dynamically method
    event,
  );

  let dataOk: boolean = false;

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
      expect(method).toHaveBeenCalledWith(data);
      resolve();
    }
  }, 10000);
};

describe('EsoStatusService (e2e)', (): void => {
  let app: INestApplication;
  let clientService: ClientService;
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

    app = await NestFactory.create(AppModule);
    await app.init();
    clientService = app.get(ClientService);

    client = clientService.getClient();
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

  it.each(<
    {
      event: EventType;
      message?: Embed;
      data?: EsoStatus | EsoStatusMaintenance | EsoStatusSlug;
    }[]
  >[
    {
      event: 'maintenancePlanned',
      message: {
        data: {
          title: 'New maintenance planned!',
          description: '**PC-PTS** => Wednesday September 11, 2024 from 13:00',
          footer: {
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
      data: {
        rawDataList: [
          {
            source: 'https://forums.elderscrollsonline.com/en/categories/pts',
            raw: 'We will be performing maintenance on the PTS on Wednesday at 9:00AM EDT (13:00 UTC). <a href="https://forums.elderscrollsonline.com/en/discussion/665349" rel="nofollow">https://forums.elderscrollsonline.com/en/discussion/665349</a>',
            slug: ServerPcPtsSlug,
            type: ServerType,
            support: PcSupport,
            zone: PtsZone,
            status: PlannedStatus,
            rawSlug: 'PTS',
            rawStatus: 'We will be performing maintenance',
            rawDate: 'Wednesday at 9:00AM EDT (13:00 UTC)',
            dates: ['2024-09-11T13:00:00.000Z'],
          },
        ],
        beginnerAt: '2024-09-11T13:00:00.000Z',
      },
    },
    {
      event: 'maintenancePlanned',
      message: {
        data: {
          title: 'New maintenance planned!',
          description:
            '**PC-EU** - **PC-NA** => Monday August 19, 2024 from 8:00 to 14:00',
          footer: {
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
      data: {
        rawDataList: [
          {
            source: 'https://forums.elderscrollsonline.com',
            raw: '• PC/Mac: NA and EU megaservers for patch maintenance – August 19, 4:00AM EDT (8:00 UTC) - 10:00AM EDT (14:00 UTC)',
            slug: ServerPcEuSlug,
            type: ServerType,
            support: PcSupport,
            zone: EuZone,
            status: PlannedStatus,
            rawSlug: 'PC/Mac: NA and EU megaservers for',
            rawDate:
              'August 19, 4:00AM EDT (8:00 UTC) - 10:00AM EDT (14:00 UTC)',
            dates: ['2024-08-19T08:00:00.000Z', '2024-08-19T14:00:00.000Z'],
          },
          {
            source: 'https://forums.elderscrollsonline.com',
            raw: '• PC/Mac: NA and EU megaservers for patch maintenance – August 19, 4:00AM EDT (8:00 UTC) - 10:00AM EDT (14:00 UTC)',
            slug: ServerPcNaSlug,
            type: ServerType,
            support: PcSupport,
            zone: NaZone,
            status: PlannedStatus,
            rawSlug: 'PC/Mac: NA and EU megaservers for',
            rawDate:
              'August 19, 4:00AM EDT (8:00 UTC) - 10:00AM EDT (14:00 UTC)',
            dates: ['2024-08-19T08:00:00.000Z', '2024-08-19T14:00:00.000Z'],
          },
        ],
        beginnerAt: '2024-08-19T08:00:00.000Z',
        endingAt: '2024-08-19T14:00:00.000Z',
      },
    },
    {
      event: 'statusUpdate',
      message: {
        data: {
          title: 'Eso Status service status changed!',
          description: '**PC-EU** => :white_check_mark:',
          footer: {
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
      data: {
        slug: ServerPcEuSlug,
        status: UpStatus,
        type: ServerType,
        support: PcSupport,
        zone: EuZone,
        raw: {
          source: 'https://live-services.elderscrollsonline.com/status/realms',
          raw: '"The Elder Scrolls Online (EU)":"UP"',
          slug: ServerPcEuSlug,
          type: ServerType,
          support: PcSupport,
          zone: EuZone,
          status: UpStatus,
          rawSlug: 'The Elder Scrolls Online (EU)',
          rawStatus: 'UP',
        },
      },
    },
    {
      event: 'disconnect',
      message: {
        data: {
          description: 'Eso status API disconnected!',
          footer: {
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
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
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
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
            text: 'Data from https://preprod.api.eso-status.com/v3/service',
            icon_url:
              'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
          },
        },
      },
    },
  ])(
    'should esoStatus connector event listen',
    async (event: {
      event: EventType;
      message?: Embed;
      data?: EsoStatus | EsoStatusMaintenance | EsoStatusSlug;
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

          client.on('ready', (): void => {
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
      expect(true).toBe(true);
    },
    15000,
  );
});
