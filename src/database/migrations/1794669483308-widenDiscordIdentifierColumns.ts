import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// A Discord identifier is a 64-bit snowflake: up to 20 digits, and 19 for the recent ones.
const discordIdentifierColumnList: {
  tableName: string;
  columnName: string;
}[] = [
  { tableName: 'server', columnName: 'serverId' },
  { tableName: 'channel', columnName: 'channelId' },
];

export class WidenDiscordIdentifierColumns1794669483308 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.setLength(queryRunner, '18', '20');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.setLength(queryRunner, '20', '18');
  }

  private async setLength(
    queryRunner: QueryRunner,
    oldLength: string,
    newLength: string,
  ): Promise<void> {
    for (const { tableName, columnName } of discordIdentifierColumnList) {
      // ⚠️ On MySQL, changeColumn drops and re-adds a column whose length changes, losing its
      // values: the column is modified in place there. SQLite has no MODIFY, and its changeColumn
      // copies the table with its rows.
      if (queryRunner.dataSource.driver.options.type === 'mysql') {
        await queryRunner.query(
          `ALTER TABLE \`${tableName}\` MODIFY \`${columnName}\` varchar(${newLength}) NOT NULL`,
        );
      } else {
        await queryRunner.changeColumn(
          tableName,
          new TableColumn({
            name: columnName,
            type: 'varchar',
            length: oldLength,
            isNullable: false,
          }),
          new TableColumn({
            name: columnName,
            type: 'varchar',
            length: newLength,
            isNullable: false,
          }),
        );
      }
    }
  }
}
