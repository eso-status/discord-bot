import { Channel } from 'src/resource/channel/entities/channel.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ synchronize: false })
export class Server {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  id: number;

  @Column({ type: 'varchar', length: 18, nullable: false })
  serverId: string;

  @CreateDateColumn({
    type: 'datetime',
    default: (): string => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @OneToMany(() => Channel, (channel: Channel) => channel.server)
  channels?: Channel[];
}
