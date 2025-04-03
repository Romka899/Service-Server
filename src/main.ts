import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


const PORT = 3000;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3001', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(PORT);
  console.log(`Сервер запущен на http://localhost:${PORT}`);
}
bootstrap();