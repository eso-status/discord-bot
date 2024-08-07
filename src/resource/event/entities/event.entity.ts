import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { EventType } from '../../../type/event.type';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity({ synchronize: false })
export class Event {
  @PrimaryColumn({
    type: 'int',
  })
  id: number;

  @Column({
    type: 'varchar',
    length: 18,
    nullable: false,
  })
  event: EventType;

  @OneToMany(
    () => Subscription,
    (subscription: Subscription) => subscription.event,
  )
  subscriptions?: Subscription[];
}
