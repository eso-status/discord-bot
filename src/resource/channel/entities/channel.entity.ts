import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Server } from '../../server/entities/server.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity({ synchronize: false })
export class Channel {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({ type: 'varchar', length: 18, nullable: false })
  channelId: string;

  @Column({ type: 'int', nullable: false })
  serverId: number;

  @CreateDateColumn({
    type: 'datetime',
    default: (): string => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @ManyToOne(() => Server, (server: Server) => server.channels)
  server: Server;

  @OneToMany(
    () => Subscription,
    (subscription: Subscription) => subscription.channel,
  )
  subscriptions?: Subscription[];
}
