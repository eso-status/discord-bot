import { config } from 'dotenv';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { runSeeder } from 'typeorm-extension';

import { dataSource } from '../../config/typeorm.config';
import { SlugSeeder } from '../seeds/slug.seeder';

config();

export class CreateSlugTable1722942864656 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'slug',
        columns: [
          {
            name: 'id',
            type: 'integer',
            length: '2',
            isPrimary: true,
            isGenerated: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '22',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    if (process.env.NODE_ENV !== 'test') {
      await runSeeder(dataSource, SlugSeeder);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('slug');
  }
}
