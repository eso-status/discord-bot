import { EsoStatusConnector } from '@eso-status/connector';
import EsoStatus, {
  DownStatus,
  EsoStatusMaintenance,
  EsoStatusRawData,
  IssuesStatus,
  PlannedStatus,
  Status,
  UpStatus,
} from '@eso-status/types';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { Client, EmbedBuilder, Events, TextChannel } from 'discord.js';

import moment from 'moment';

import { ChannelService } from '../../resource/channel/channel.service';
import { Channel } from '../../resource/channel/entities/channel.entity';

@Injectable()
export class EsoStatusService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly channelService: ChannelService,
    private readonly client: Client,
  ) {
    this.client.on(Events.ClientReady, (): void => {
      const esoStatusConnector: EsoStatusConnector =
        EsoStatusConnector.listen();
      esoStatusConnector
        .on(
          'maintenancePlanned',
          (maintenanceEsoStatus: EsoStatusMaintenance): void => {
            this.eventEmitter.emit(
              'esoStatus.maintenancePlanned',
              maintenanceEsoStatus,
            );
          },
        )
        .on('statusUpdate', (esoStatus: EsoStatus): void => {
          this.eventEmitter.emit('esoStatus.statusUpdate', esoStatus);
        })
        .on('connected', (): void => {
          this.eventEmitter.emit('esoStatus.connected');
        })
        .on('disconnect', (): void => {
          this.eventEmitter.emit('esoStatus.disconnect');
        })
        .on('reconnect', (): void => {
          this.eventEmitter.emit('esoStatus.reconnect');
        });
    });
  }

  public async sendMessage(
    channelId: string,
    message: EmbedBuilder,
  ): Promise<void> {
    const channel: TextChannel | undefined = this.client.channels.cache.get(
      channelId,
    ) as TextChannel | undefined;
    await channel?.send({ embeds: [message] });
  }

  public generateListenerStatusEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setDescription(message)
      .setTimestamp()
      .setFooter({
        text: 'Data from https://preprod.api.eso-status.com/v3/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  public getIconByStatus(status: Status): string {
    switch (status) {
      case PlannedStatus:
        return ':date:';
      case DownStatus:
        return ':x:';
      case UpStatus:
        return ':white_check_mark:';
      case IssuesStatus:
      default:
        return ':wrench:';
    }
  }

  public generateMaintenancePlannedDescription(
    maintenanceEsoStatus: EsoStatusMaintenance,
  ): string {
    const ending: string = maintenanceEsoStatus.endingAt
      ? ` to ${moment(maintenanceEsoStatus.endingAt).utcOffset(0).format('H:mm')}`
      : '';
    return `${maintenanceEsoStatus.rawDataList
      .map((rawData: EsoStatusRawData): string => {
        return `**${rawData.support.toUpperCase()}-${rawData.zone.toUpperCase()}**`;
      })
      .join(
        ' - ',
      )} => ${moment(maintenanceEsoStatus.beginnerAt).utcOffset(0).format('dddd MMMM DD, YYYY')} from ${moment(maintenanceEsoStatus.beginnerAt).utcOffset(0).format('H:mm')}${ending}`;
  }

  public generateMaintenancePlannedEmbed(
    maintenanceEsoStatus: EsoStatusMaintenance,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#0d1118')
      .setTitle(`New maintenance planned!`)
      .setDescription(
        this.generateMaintenancePlannedDescription(maintenanceEsoStatus),
      )
      .setTimestamp()
      .setFooter({
        text: 'Data from https://preprod.api.eso-status.com/v3/service',
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
        text: 'Data from https://preprod.api.eso-status.com/v3/service',
        iconURL: 'https://avatars.githubusercontent.com/u/87777413?s=200&v=4',
      });
  }

  @OnEvent('esoStatus.connected')
  public async connected() {
    const channelList: Channel[] =
      await this.channelService.getBySubscriptionEvent('connected');

    await Promise.all(
      channelList.map(async (channel: Channel): Promise<void> =>
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
      channelList.map(async (channel: Channel): Promise<void> =>
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
      channelList.map(async (channel: Channel): Promise<void> =>
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
      channelList.map(async (channel: Channel): Promise<void> =>
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
      channelList.map(async (channel: Channel): Promise<void> =>
        this.sendMessage(
          channel.channelId,
          this.generateStatusEmbed(esoStatus),
        ),
      ),
    );
  }
}
