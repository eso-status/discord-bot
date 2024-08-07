import { Slug as EsoStatusSlug } from '@eso-status/types';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity({ synchronize: false })
export class Slug {
  @PrimaryColumn({
    type: 'int',
  })
  id: number;

  @Column({
    type: 'varchar',
    length: 22,
    nullable: false,
  })
  slug: EsoStatusSlug;

  @OneToMany(
    () => Subscription,
    (subscription: Subscription) => subscription.slug,
  )
  subscriptions?: Subscription[];
}
