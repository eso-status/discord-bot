import { config } from 'dotenv';
import { MigrationInterface, Repository } from 'typeorm';

import { dataSource } from '../../config/typeorm.config';
import { Event } from '../../resource/event/entities/event.entity';
import { eventData } from '../data/event.data';

config({ quiet: true });

const newEvent: Event = eventData[4];

export class UpdateDataEventTable1723373287069 implements MigrationInterface {
  public async up(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      const repository: Repository<Event> = dataSource.getRepository(Event);
      await repository.save(repository.create(newEvent));
    }
  }

  public async down(): Promise<void> {
    const repository: Repository<Event> = dataSource.getRepository(Event);
    await repository.delete(newEvent);
  }
}
