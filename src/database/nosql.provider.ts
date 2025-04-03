import { Provider } from '@nestjs/common';
import * as NoSQL from 'nosql';
import * as path from 'path';
import * as fs from 'fs';

export const NOSQL_DB_PROVIDER = 'NOSQL_DB_PROVIDER';

export const nosqlDbProvider: Provider = {
  provide: NOSQL_DB_PROVIDER,
  useFactory: () => {
    const dbPath = path.join(process.cwd(), 'db.nosql');
    
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, '', 'utf8');
    }

    const db = NoSQL.load(dbPath);

    db.on('load', () => console.log('База данных успешно загружена.'));
    db.on('error', (err) => console.error('Ошибка базы данных:', err));

    return db;
  },
};