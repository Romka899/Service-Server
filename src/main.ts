import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import multer from 'multer';

const PORT = 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: 'http://localhost:3001', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'images'),{
    prefix: '/images',
  })
  app.use(multer({
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  }).any());
  await app.listen(PORT);
  console.log(`Сервер запущен на http://localhost:${PORT}`);
}
bootstrap();