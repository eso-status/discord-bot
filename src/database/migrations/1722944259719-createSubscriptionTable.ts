import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSubscriptionTable1722944259719
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subscription',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'channelId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'eventId',
            type: 'integer',
            length: '1',
            isNullable: false,
          },
          {
            name: 'slugId',
            type: 'integer',
            length: '2',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_SubscriptionChannel',
            columnNames: ['channelId'],
            referencedTableName: 'channel',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_SubscriptionEvent',
            columnNames: ['eventId'],
            referencedTableName: 'event',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'FK_SubscriptionSlug',
            columnNames: ['slugId'],
            referencedTableName: 'slug',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('subscription');
  }
}
