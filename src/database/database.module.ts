import { Module } from '@nestjs/common';
import { nosqlDbProvider } from './nosql.provider';

@Module({
  providers: [nosqlDbProvider],
  exports: [nosqlDbProvider],
})
export class DatabaseModule {}