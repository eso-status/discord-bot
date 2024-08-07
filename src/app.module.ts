import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { discordConfig } from './config/discord.config';
import { dataSourceOptions } from './config/typeorm.config';
import { RegisterCommand } from './provider/register-command/register-command';

import { ChannelService } from './resource/channel/channel.service';
import { Channel } from './resource/channel/entities/channel.entity';
import { Event } from './resource/event/entities/event.entity';
import { EventService } from './resource/event/event.service';
import { Server } from './resource/server/entities/server.entity';
import { ServerService } from './resource/server/server.service';
import { Slug } from './resource/slug/entities/slug.entity';
import { SlugService } from './resource/slug/slug.service';
import { Subscription } from './resource/subscription/entities/subscription.entity';
import { SubscriptionService } from './resource/subscription/subscription.service';
import { EsoStatusService } from './service/eso-status/eso-status.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DiscordModule.forRootAsync(discordConfig),
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([Event, Slug, Server, Channel, Subscription]),
  ],
  providers: [
    EventService,
    SlugService,
    ServerService,
    ChannelService,
    SubscriptionService,
    RegisterCommand,
    EsoStatusService,
  ],
})
export class AppModule {}
