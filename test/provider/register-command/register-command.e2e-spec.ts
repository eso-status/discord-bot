import { EventType } from '@discord-nestjs/core/dist/definitions/types/event.type';
import { ClientService } from '@discord-nestjs/core/dist/services/client.service';
import { Slug as EsoStatusSlug } from '@eso-status/types';
import { INestApplication } from '@nestjs/common';
import {
  Client,
  CommandInteraction,
  CommandInteractionOption,
} from 'discord.js';

import { config } from 'dotenv';
import { Channel } from 'src/resource/channel/entities/channel.entity';
import { Event } from 'src/resource/event/entities/event.entity';
import { Server } from 'src/resource/server/entities/server.entity';
import { Slug } from 'src/resource/slug/entities/slug.entity';
import { Subscription } from 'src/resource/subscription/entities/subscription.entity';
import { Repository } from 'typeorm';
import { runSeeders } from 'typeorm-extension';

import { dataSource } from '../../../src/config/typeorm.config';
import { eventData } from '../../../src/database/data/event.data';
import { slugData } from '../../../src/database/data/slug.data';
import { bootstrap } from '../../../src/main';
import { RegisterCommand } from '../../../src/provider/register-command/register-command';

import SpyInstance = jest.SpyInstance;

config();

const testCommand = (
  client: Client,
  commandName: string,
  doOnRegister: SpyInstance<Promise<string>>,
  resolve: (value?: void | PromiseLike<void>) => void,
  guildId: string,
  channelId: string,
  event: EventType = 'all',
  slug: EsoStatusSlug = <EsoStatusSlug>'all',
) => {
  const commandInteractionOptionList: CommandInteractionOption[] = [];
  let commandInteractionOptionEvent: CommandInteractionOption;
  let commandInteractionOptionSlug: CommandInteractionOption;
  if (event !== 'all') {
    commandInteractionOptionEvent = { name: 'event', type: 3, value: event };
    commandInteractionOptionList.push(commandInteractionOptionEvent);
  }
  if (slug !== <EsoStatusSlug>'all') {
    commandInteractionOptionSlug = { name: 'slug', type: 3, value: slug };
    commandInteractionOptionList.push(commandInteractionOptionSlug);
  }

  // @ts-expect-error Necessary to emulate Interaction
  client.emit('interactionCreate', <CommandInteraction>{
    isChatInputCommand: (): boolean => true,
    channelId,
    guildId,
    commandName,
    options: {
      _hoistedOptions: commandInteractionOptionList,
      get: (
        name: string,
        required?: boolean,
      ): CommandInteractionOption | null => {
        if (name === 'event' && event !== <EventType>'all') {
          return commandInteractionOptionEvent;
        }

        if (name === 'slug' && slug !== <EsoStatusSlug>'all') {
          return commandInteractionOptionSlug;
        }

        return null;
      },
    },
  });

  setTimeout((): void => {
    expect(doOnRegister).toHaveBeenCalledWith(guildId, channelId, event, slug);
    // TODO listen le chat pour voir si le méssage y est bien reçu
    resolve();
  }, 10000);
};

describe('RegisterCommand (e2e)', (): void => {
  let app: INestApplication;
  let clientService: ClientService;
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

    app = await bootstrap();
    clientService = app.get(ClientService);

    registerCommand = app.get(RegisterCommand);
    doOnRegister = jest.spyOn(registerCommand, 'doOnRegister');
    client = clientService.getClient();

    subscriptionRepository = dataSource.getRepository(Subscription);
    channelRepository = dataSource.getRepository(Channel);
    serverRepository = dataSource.getRepository(Server);
  });

  beforeEach(async (): Promise<void> => {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await runSeeders(dataSource);
  });

  afterAll(async (): Promise<void> => {
    await app.close();
    await client.destroy();
  });

  it('should register with new server and new channel with single event and single slug', async (): Promise<void> => {
    expect(
      await serverRepository.count({
        where: {
          serverId: '382941103063564288',
        },
      }),
    ).toEqual(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: '609315815770161162',
        },
      }),
    ).toEqual(0);

    await new Promise<void>(
      (resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (client.isReady()) {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        }
        client.on('ready', (): void => {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        });
      },
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: '382941103063564288',
      },
    });
    expect(serverList.length).toEqual(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: '609315815770161162',
      },
    });
    expect(channelList.length).toEqual(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList.length).toEqual(1);
    expect(subscriptionList[0].eventId).toEqual(3);
    expect(subscriptionList[0].slugId).toEqual(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with not new server and new channel with single event and single slug', async (): Promise<void> => {
    const server: Server = await serverRepository.save(
      serverRepository.create({
        serverId: '382941103063564288',
      }),
    );

    await channelRepository.save(
      channelRepository.create({
        channelId: '609315815770161163',
        serverId: server.id,
      }),
    );

    expect(
      await serverRepository.count({
        where: {
          serverId: '382941103063564288',
        },
      }),
    ).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          channelId: '609315815770161162',
        },
      }),
    ).toEqual(0);

    await new Promise<void>(
      (resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (client.isReady()) {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        }
        client.on('ready', (): void => {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        });
      },
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: '382941103063564288',
      },
    });
    expect(serverList.length).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toEqual(2);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: '609315815770161162',
      },
    });
    expect(channelList.length).toEqual(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList.length).toEqual(1);
    expect(subscriptionList[0].eventId).toEqual(3);
    expect(subscriptionList[0].slugId).toEqual(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with not new server and not new channel with single event and single slug', async (): Promise<void> => {
    const server: Server = await serverRepository.save(
      serverRepository.create({
        serverId: '382941103063564288',
      }),
    );

    const channel: Channel = await channelRepository.save(
      channelRepository.create({
        channelId: '609315815770161162',
        serverId: server.id,
      }),
    );

    expect(
      await serverRepository.count({
        where: {
          serverId: '382941103063564288',
        },
      }),
    ).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          channelId: '609315815770161162',
        },
      }),
    ).toEqual(1);

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
    ).toEqual(2);

    await new Promise<void>(
      (resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (client.isReady()) {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        }
        client.on('ready', (): void => {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
            'server_pc_eu',
          );
        });
      },
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: '382941103063564288',
      },
    });
    expect(serverList.length).toEqual(1);

    expect(
      await channelRepository.count({
        where: {
          serverId: server.id,
        },
      }),
    ).toEqual(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: '609315815770161162',
      },
    });
    expect(channelList.length).toEqual(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList.length).toEqual(1);
    expect(subscriptionList[0].eventId).toEqual(3);
    expect(subscriptionList[0].slugId).toEqual(6);
    expect(subscriptionList[0].channelId).toEqual(channelList[0].id);
  }, 15000);

  it('should register with new server and new channel with single event and no slug', async (): Promise<void> => {
    expect(
      await serverRepository.count({
        where: {
          serverId: '382941103063564288',
        },
      }),
    ).toEqual(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: '609315815770161162',
        },
      }),
    ).toEqual(0);

    await new Promise<void>(
      (resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (client.isReady()) {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
          );
        }
        client.on('ready', (): void => {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
            'statusUpdate',
          );
        });
      },
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: '382941103063564288',
      },
    });
    expect(serverList.length).toEqual(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: '609315815770161162',
      },
    });
    expect(channelList.length).toEqual(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      select: ['eventId', 'slugId'],
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList.length).toEqual(slugData.length);

    const expectList: { eventId: number; slugId: number }[] = [];
    slugData.forEach((slug: Slug): void => {
      expectList.push({ eventId: 3, slugId: slug.id });
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
          serverId: '382941103063564288',
        },
      }),
    ).toEqual(0);

    expect(
      await channelRepository.count({
        where: {
          channelId: '609315815770161162',
        },
      }),
    ).toEqual(0);

    await new Promise<void>(
      (resolve: (value?: void | PromiseLike<void>) => void): void => {
        if (client.isReady()) {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
          );
        }
        client.on('ready', (): void => {
          testCommand(
            client,
            'register',
            doOnRegister,
            resolve,
            '382941103063564288',
            '609315815770161162',
          );
        });
      },
    );

    const serverList: Server[] = await serverRepository.find({
      where: {
        serverId: '382941103063564288',
      },
    });
    expect(serverList.length).toEqual(1);

    const channelList: Channel[] = await channelRepository.find({
      where: {
        channelId: '609315815770161162',
      },
    });
    expect(channelList.length).toEqual(1);
    expect(channelList[0].serverId).toEqual(serverList[0].id);

    const subscriptionList: Subscription[] = await subscriptionRepository.find({
      select: ['eventId', 'slugId'],
      where: {
        channelId: channelList[0].id,
      },
    });
    expect(subscriptionList.length).toEqual(slugData.length * eventData.length);

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
