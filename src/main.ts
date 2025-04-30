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
    origin: 'http://localhost:3001', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(express.json());
  app.use(express.urlencoded({extended: true}))

  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useStaticAssets(join(process.cwd(), 'images'),{
    prefix: '/images',
  })

  await app.listen(PORT);
  console.log(`Сервер запущен на http://localhost:${PORT}`);
}
bootstrap();