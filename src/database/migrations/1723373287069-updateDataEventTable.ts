import { config } from 'dotenv';
import { MigrationInterface, QueryRunner, Repository } from 'typeorm';

import { dataSource } from '../../config/typeorm.config';
import { Event } from '../../resource/event/entities/event.entity';
import { eventData } from '../data/event.data';

config();

const newEvent: Event = eventData[4];

export class UpdateDataEventTable1723373287069 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      const repository: Repository<Event> = dataSource.getRepository(Event);
      await repository.insert(newEvent);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const repository: Repository<Event> = dataSource.getRepository(Event);
    await repository.delete(newEvent);
  }
}
