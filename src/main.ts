import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import * as express from 'express';


const PORT = 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
     origin: true, 
     methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
     credentials: true,
     allowedHeaders: ['Content-Type','Authorization']  
  });

  app.use(express.json());
  app.use(express.urlencoded({extended: true}))

  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        secure: false
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/images', express.static(join(__dirname, '..', 'images')));

  await app.listen(PORT);
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  //console.log(`Изображения доступны по: http://localhost:${PORT}/images/filename.jpg`);
}
bootstrap();