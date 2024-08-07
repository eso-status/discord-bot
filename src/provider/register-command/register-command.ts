import { SlashCommandPipe } from '@discord-nestjs/common';
import { Command, Handler, IA } from '@discord-nestjs/core';

import { Slug as EsoStatusSlug } from '@eso-status/types';

import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';
import { Channel } from 'src/resource/channel/entities/channel.entity';

import { Event } from 'src/resource/event/entities/event.entity';

import { EventType } from 'src/type/event.type';

import { ChannelService } from '../../resource/channel/channel.service';
import { EventService } from '../../resource/event/event.service';
import { Server } from '../../resource/server/entities/server.entity';
import { ServerService } from '../../resource/server/server.service';
import { Slug } from '../../resource/slug/entities/slug.entity';
import { SlugService } from '../../resource/slug/slug.service';
import { SubscriptionService } from '../../resource/subscription/subscription.service';

import { RegisterDto } from './register.dto';

@Command({
  name: 'register',
  description: 'Register to received EsoStatus event',
})
@Injectable()
export class RegisterCommand {
  constructor(
    private readonly eventService: EventService,
    private readonly slugService: SlugService,
    private readonly serverService: ServerService,
    private readonly channelService: ChannelService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Handler()
  public async onRegister(
    @IA(SlashCommandPipe) dto: RegisterDto,
    @IA() interaction: CommandInteraction,
  ): Promise<string> {
    return this.doOnRegister(
      interaction.guildId,
      interaction.channelId,
      dto.event,
      dto.slug,
    );
  }

  public async doOnRegister(
    guildId: string,
    channelId: string,
    event: EventType,
    slug: EsoStatusSlug,
  ): Promise<string> {
    const eventList: Event[] =
      event === <EventType>'all'
        ? await this.eventService.getAll()
        : [await this.eventService.getByEvent(event)];
    const slugList: Slug[] =
      slug === <EsoStatusSlug>'all'
        ? await this.slugService.getAll()
        : [await this.slugService.getBySlug(slug)];

    let server: Server = await this.serverService.getByServerId(guildId);
    if (!server) {
      server = await this.serverService.add(guildId);
    }

    let channel: Channel = await this.channelService.getByChannelId(channelId);
    if (!channel) {
      channel = await this.channelService.add(channelId, server.id);
    }

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

    return `Successfully registered!`;
  }
}
