import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { EventSeeder } from '../database/seeds/event.seeder';
import { SlugSeeder } from '../database/seeds/slug.seeder';
import { Channel } from '../resource/channel/entities/channel.entity';
import { Event } from '../resource/event/entities/event.entity';
import { Server } from '../resource/server/entities/server.entity';
import { Slug } from '../resource/slug/entities/slug.entity';
import { Subscription } from '../resource/subscription/entities/subscription.entity';

config();

const customDataSourceOptions: {
  mysql: DataSourceOptions & SeederOptions;
  sqlite: DataSourceOptions & SeederOptions;
} = { mysql: null, sqlite: null };

customDataSourceOptions.mysql = {
  type: <'mysql'>process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: [Server, Channel, Event, Slug, Subscription],
  migrations: ['dist/database/migrations/*.js'],
  seeds: [EventSeeder, SlugSeeder],
  factories: [],
  migrationsRun: false,
  logging: process.env.DB_DEBUG === 'true',
  dropSchema: false,
};

customDataSourceOptions.sqlite = {
  type: <'sqlite'>process.env.DB_TYPE,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: [Server, Channel, Event, Slug, Subscription],
  migrations: ['dist/database/migrations/*.js'],
  seeds: [EventSeeder, SlugSeeder],
  factories: [],
  migrationsRun: false,
  logging: process.env.DB_DEBUG === 'true',
  dropSchema: false,
};

export const dataSourceOptions: DataSourceOptions & SeederOptions = <
  DataSourceOptions & SeederOptions
>customDataSourceOptions[process.env.DB_TYPE];

export const dataSource: DataSource = new DataSource(dataSourceOptions);
