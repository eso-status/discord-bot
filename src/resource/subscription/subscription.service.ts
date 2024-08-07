import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async add(
    channelId: number,
    eventId: number,
    slugId: number,
  ): Promise<Subscription> {
    return this.subscriptionRepository.save(
      this.subscriptionRepository.create({
        channelId,
        eventId,
        slugId,
      }),
    );
  }

  async deleteByChannelId(channelId: number): Promise<void> {
    const subscriptionList: Subscription[] =
      await this.subscriptionRepository.find({
        relations: ['channel'],
        where: {
          channel: {
            id: channelId,
          },
        },
      });
    await Promise.all(
      subscriptionList.map(
        async (subscription: Subscription): Promise<DeleteResult> => {
          return this.subscriptionRepository.delete({
            id: subscription.id,
          });
        },
      ),
    );
  }
}
