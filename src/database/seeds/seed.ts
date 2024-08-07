import 'reflect-metadata';
import { runSeeders } from 'typeorm-extension';

import { dataSource } from '../../config/typeorm.config';

dataSource
  .initialize()
  .then(async (): Promise<void> => {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await runSeeders(dataSource);
    process.exit();
  })
  .catch((error: Error): void => {
    throw error;
  });
