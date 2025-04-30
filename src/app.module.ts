import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { BannersModule } from './banners/banners.module';
import { AuthMiddleware } from './session.middleware';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BannersModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('api/save-banner');
  }
}