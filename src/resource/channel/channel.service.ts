import { Slug } from '@eso-status/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventType } from '../../type/event.type';

import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async getByChannelId(channelId: string): Promise<Channel> {
    return this.channelRepository.findOne({
      relations: ['subscriptions'],
      where: {
        channelId,
      },
    });
  }

  async add(channelId: string, serverId: number): Promise<Channel> {
    return this.channelRepository.save(
      this.channelRepository.create({
        channelId,
        serverId,
      }),
    );
  }

  async getBySubscriptionEvent(event: EventType): Promise<Channel[]> {
    return this.channelRepository.find({
      relations: ['subscriptions', 'subscriptions.event'],
      where: {
        subscriptions: {
          event: {
            event,
          },
        },
      },
    });
  }

  async getBySubscriptionEventAndSlug(
    event: EventType,
    slug: Slug,
  ): Promise<Channel[]> {
    return this.channelRepository.find({
      relations: ['subscriptions', 'subscriptions.event', 'subscriptions.slug'],
      where: {
        subscriptions: {
          event: {
            event,
          },
          slug: {
            slug,
          },
        },
      },
    });
  }
}
