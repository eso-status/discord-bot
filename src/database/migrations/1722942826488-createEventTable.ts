import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { runSeeder } from 'typeorm-extension';

import { dataSource } from '../../config/typeorm.config';
import { EventSeeder } from '../seeds/event.seeder';

export class CreateEventTable1722942826488 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'event',
        columns: [
          {
            name: 'id',
            type: 'integer',
            length: '1',
            isPrimary: true,
            isGenerated: false,
          },
          {
            name: 'event',
            type: 'varchar',
            length: '18',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    if (process.env.NODE_ENV !== 'test') {
      await runSeeder(dataSource, EventSeeder);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('event');
  }
}
