import { InjectDiscordClient } from '@discord-nestjs/core';
import { EsoStatusConnector } from '@eso-status/connector';
import { EsoStatus, EsoStatusMaintenance, Status } from '@eso-status/types';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { Client, EmbedBuilder, TextChannel } from 'discord.js';

import { ChannelService } from '../../resource/channel/channel.service';
import { Channel } from '../../resource/channel/entities/channel.entity';
import { EventType } from '../../type/event.type';

@Injectable()
export class EsoStatusService {
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly channelService: ChannelService,
    @InjectDiscordClient()
    private readonly client: Client,
  ) {
    let esoStatusEventEmitter: EsoStatusConnector;
    this.client.on('ready', (): void => {
      esoStatusEventEmitter = EsoStatusConnector.listen();
      esoStatusEventEmitter.emit = (function replaceEmit(
        original: any,
        customEventEmitter: EventEmitter2,
      ) {
        return function emit(name: EventType, callback: any): any {
          customEventEmitter.emit(`esoStatus.${name}`, callback);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          return original(name, callback);
        };
      })(
        esoStatusEventEmitter.emit.bind(esoStatusEventEmitter),
        this.eventEmitter,
      );
    });
  }

  public async sendMessage(
    channelId: string,
    message: EmbedBuilder,
  ): Promise<void> {
    const channel: TextChannel = this.client.channels.cache.get(
      channelId,
    ) as TextChannel;
    await channel?.send({ embeds: [message] });
  }

  public generateListenerStatusEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setDescription(message)
      .setTimestamp()
      .setFooter({
        text: 'Data from https://api.eso-status.com/v2/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  public getIconByStatus(status: Status): string {
    switch (status) {
      case 'planned':
        return ':date:';
      case 'down':
        return ':x:';
      case 'up':
        return ':white_check_mark:';
      case 'issues':
        return ':wrench:';
      default:
        return '';
    }
  }

  public generateMaintenancePlannedEmbed(
    maintenanceEsoStatus: EsoStatusMaintenance,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setTitle(`New maintenance planned!`)
      .setDescription(maintenanceEsoStatus.rawDataList[0].raw)
      .setTimestamp()
      .setFooter({
        text: 'Data from https://api.eso-status.com/v2/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  public generateStatusEmbed(esoStatus: EsoStatus): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setTitle(`Eso Status service status changed!`)
      .setDescription(
        `**${esoStatus.support.toUpperCase()}-${esoStatus.zone.toUpperCase()}** => ${this.getIconByStatus(esoStatus.status)}`,
      )
      .setTimestamp()
      .setFooter({
        text: 'Data from https://api.eso-status.com/v2/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  @OnEvent('esoStatus.connected')
  public async connected() {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEvent('connected');

    await Promise.all(
      channelList.map(
        async (channel: Channel): Promise<void> =>
          this.sendMessage(
            channel.channelId,
            this.generateListenerStatusEmbed('Eso status API connected!'),
          ),
      ),
    );
  }

  @OnEvent('esoStatus.disconnect')
  public async disconnect() {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEvent('disconnect');

    await Promise.all(
      channelList.map(
        async (channel: Channel): Promise<void> =>
          this.sendMessage(
            channel.channelId,
            this.generateListenerStatusEmbed('Eso status API disconnected!'),
          ),
      ),
    );
  }

  @OnEvent('esoStatus.reconnect')
  public async reconnect() {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEvent('reconnect');

    await Promise.all(
      channelList.map(
        async (channel: Channel): Promise<void> =>
          this.sendMessage(
            channel.channelId,
            this.generateListenerStatusEmbed('Eso status API reconnected!'),
          ),
      ),
    );
  }

  @OnEvent('esoStatus.maintenancePlanned')
  public async maintenancePlanned(maintenanceEsoStatus: EsoStatusMaintenance) {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEventAndSlug(
        'maintenancePlanned',
        maintenanceEsoStatus.rawDataList[0].slug,
      );

    await Promise.all(
      channelList.map(
        async (channel: Channel): Promise<void> =>
          this.sendMessage(
            channel.channelId,
            this.generateMaintenancePlannedEmbed(maintenanceEsoStatus),
          ),
      ),
    );
  }

  @OnEvent('esoStatus.statusUpdate')
  public async statusUpdate(esoStatus: EsoStatus) {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEventAndSlug(
        'statusUpdate',
        esoStatus.slug,
      );

    await Promise.all(
      channelList.map(
        async (channel: Channel): Promise<void> =>
          this.sendMessage(
            channel.channelId,
            this.generateStatusEmbed(esoStatus),
          ),
      ),
    );
  }
}
