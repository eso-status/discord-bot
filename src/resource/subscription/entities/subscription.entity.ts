import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Channel } from '../../channel/entities/channel.entity';
import { Event } from '../../event/entities/event.entity';
import { Slug } from '../../slug/entities/slug.entity';

@Entity({ synchronize: false })
export class Subscription {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({ type: 'int', nullable: false })
  channelId: number;

  @Column({ type: 'int', nullable: false })
  eventId: number;

  @Column({ type: 'int', nullable: true })
  slugId: number;

  @CreateDateColumn({
    type: 'datetime',
    default: (): string => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @ManyToOne(() => Channel, (channel: Channel) => channel.subscriptions)
  channel: Channel;

  @ManyToOne(() => Event, (event: Event) => event.subscriptions)
  event: Event;

  @ManyToOne(() => Slug, (slug: Slug) => slug.subscriptions)
  slug?: Slug;
}
