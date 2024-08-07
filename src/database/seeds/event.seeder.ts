import { DataSource, InsertResult, Repository } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { Event } from '../../resource/event/entities/event.entity';
import { eventData } from '../data/event.data';

export class EventSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository: Repository<Event> = dataSource.getRepository(Event);
    await Promise.all(
      eventData.map((event: Event): Promise<InsertResult> => {
        return repository.insert(event);
      }),
    );
  }
}
