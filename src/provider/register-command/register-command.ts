import { Slug as EsoStatusSlug } from '@eso-status/types';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  Interaction,
} from 'discord.js';
import { Channel } from '../../resource/channel/entities/channel.entity';

import { Event } from '../../resource/event/entities/event.entity';

import { EventType } from '../../type/event.type';

import { ChannelService } from '../../resource/channel/channel.service';
import { EventService } from '../../resource/event/event.service';
import { Server } from '../../resource/server/entities/server.entity';
import { ServerService } from '../../resource/server/server.service';
import { Slug } from '../../resource/slug/entities/slug.entity';
import { SlugService } from '../../resource/slug/slug.service';
import { SubscriptionService } from '../../resource/subscription/subscription.service';

import { registerCommandDefinition } from './register-command.definition';

@Injectable()
export class RegisterCommand implements OnModuleInit {
  private readonly logger: Logger = new Logger(RegisterCommand.name);

  constructor(
    private readonly eventService: EventService,
    private readonly slugService: SlugService,
    private readonly serverService: ServerService,
    private readonly channelService: ChannelService,
    private readonly subscriptionService: SubscriptionService,
    private readonly client: Client,
  ) {}

  public onModuleInit(): void {
    this.client.on(Events.ClientReady, (readyClient: Client<true>): void => {
      void this.registerCommand(readyClient);
    });
    this.client.on(
      Events.InteractionCreate,
      (interaction: Interaction): void => {
        void this.handleInteraction(interaction);
      },
    );
  }

  public async onRegister(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const message: string = await this.doOnRegister(
      interaction.guildId,
      interaction.channelId,
      (interaction.options.getString('event') ?? 'all') as EventType,
      (interaction.options.getString('slug') ?? 'all') as EsoStatusSlug,
    );

    await interaction.reply({ embeds: [this.generateEmbed(message)] });
  }

  public generateEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setDescription(message)
      .setTimestamp()
      .setFooter({
        text: 'Data from https://api.eso-status.com/v2/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  public async doOnRegister(
    guildId: string,
    channelId: string,
    event: EventType,
    slug: EsoStatusSlug,
  ): Promise<string> {
    const eventList: Event[] =
      event === ('all' as EventType)
        ? await this.eventService.getAll()
        : [await this.eventService.getByEvent(event)];
    const slugList: Slug[] =
      slug === ('all' as EsoStatusSlug)
        ? await this.slugService.getAll()
        : [await this.slugService.getBySlug(slug)];

    const server: Server =
      (await this.serverService.getByServerId(guildId)) ??
      (await this.serverService.add(guildId));

    const channel: Channel =
      (await this.channelService.getByChannelId(channelId)) ??
      (await this.channelService.add(channelId, server.id));

    await this.subscriptionService.deleteByChannelId(channel.id);

    await Promise.all(
      eventList.map(async (eventItem: Event): Promise<void> => {
        await Promise.all(
          slugList.map(async (slugItem: Slug): Promise<void> => {
            await this.subscriptionService.add(
              channel.id,
              eventItem.id,
              slugItem.id,
            );
          }),
        );
      }),
    );

    return 'Successfully registered!';
  }

  private async registerCommand(readyClient: Client<true>): Promise<void> {
    try {
      await readyClient.application.commands.create(registerCommandDefinition);
    } catch (error) {
      this.logger.error(
        'The register command could not be registered',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (
      !interaction.isChatInputCommand() ||
      interaction.commandName !== registerCommandDefinition.name
    ) {
      return;
    }

    try {
      await this.onRegister(interaction);
    } catch (error) {
      this.logger.error(
        'The register command failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
