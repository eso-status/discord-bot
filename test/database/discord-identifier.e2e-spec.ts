import { config } from 'dotenv';
import { QueryRunner, Table } from 'typeorm';

import { dataSource } from '../../src/config/typeorm.config';

config({ quiet: true });

describe('Discord identifier columns (e2e)', (): void => {
  beforeAll(async (): Promise<void> => {
    await dataSource.initialize();
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  }, 15000);

  afterAll(async (): Promise<void> => {
    await dataSource.destroy();
  }, 15000);

  // A Discord identifier is a 64-bit snowflake: up to 20 digits, and 19 for the recent ones.
  it.each([
    { tableName: 'server', columnName: 'serverId' },
    { tableName: 'channel', columnName: 'channelId' },
  ])(
    'should hold a 20-digit Discord identifier in $tableName.$columnName',
    async ({
      tableName,
      columnName,
    }: {
      tableName: string;
      columnName: string;
    }): Promise<void> => {
      const queryRunner: QueryRunner = dataSource.createQueryRunner();
      const table: Table | undefined = await queryRunner.getTable(tableName);
      await queryRunner.release();

      expect(table?.findColumnByName(columnName)?.length).toBe('20');
    },
    15000,
  );
});
