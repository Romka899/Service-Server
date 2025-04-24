import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { BannersModule } from './banners/banners.module';
import { SessionMiddleware } from './session.middleware';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BannersModule
  ],
})
export class AppModule {

}