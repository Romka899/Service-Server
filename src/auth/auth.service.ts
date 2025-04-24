import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { NOSQL_DB_PROVIDER } from '../database/nosql.provider';
import * as NoSQL from 'nosql';
import { Request } from 'express';
import * as crypto from 'crypto';
import { LoginResponse } from './auth.types';
import { rejects } from 'assert';
import { filter } from 'rxjs';
import { resolve } from 'path';



declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      role: string;
      loggedInAt: Date;
    };
  }
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(NOSQL_DB_PROVIDER) private readonly db: any,
  ) {}

  private async findUser(username: string): Promise<LoginResponse[]> {
    return new Promise<LoginResponse[]>((resolve, reject) => {
      this.db.find().make((filter) => {
        filter.where('username', username);
        filter.callback((err, users) => {
          if (err) reject(err);
          else resolve(users);
        });
      });
    });
  }

  async register(username: string, password: string): Promise<string> {
    if (!username || !password) {
      throw new Error('Имя пользователя и пароль обязательны');
    }

    return new Promise((resolve, reject) => {
      this.db.find().make((filter) => {
        filter.where('username', username);
        filter.callback((err, users) => {
          if (err) {
            console.error('Ошибка при поиске пользователя:', err);
            return reject(new Error('Ошибка сервера'));
          }

          if (users.length > 0) {
            return reject(new Error('Пользователь с таким именем уже существует'));
          }

          const newUser = { username, password, role: 'Зарегистрированный пользователь' };
          
          this.db.insert(newUser);
          
          console.log('Пользователь успешно зарегистрирован:', newUser);
          resolve('Пользователь успешно зарегистрирован');
        });
      });
    });
  }

  async login(username: string, password: string, req: Request): Promise<LoginResponse> {
    if (!username || !password) {
      throw new HttpException('Имя пользователя и пароль обязательны', HttpStatus.BAD_REQUEST);
    }
    
    const users = await new Promise<any[]>((resolve, reject) =>{
      this.db.find().make((filter) =>{
        filter.where('username', username);
        filter.where('password', password);
        filter.callback((err, users) => {
          if (err) return reject(err);
          resolve(users);
        });
      });
    });

    /*
    try {
      const users = await new Promise<any[]>((resolve, reject) => {
        this.db.find().make((filter) => {
          filter.where('username', username);
          filter.where('password', password);
          filter.callback((err, users) => {
            if (err) return reject(err);
            resolve(users);
          });
        });
      });
  */
      //console.log('Результат поиска:', users);
  
      if (users.length === 0) {
        throw new HttpException('Неверные учетные данные', HttpStatus.UNAUTHORIZED);
      }
    
      const user = users[0];
      const SessionUser = {
        id: user.id || crypto.randomBytes(16).toString('hex'),
        username: user.username,
        role: user.role || 'user',
        loggedInAt: new Date()
      };

      req.session.user = SessionUser;

      await new Promise<void>((resolve, reject) =>{
        req.session.save((err) =>{
          if (err) reject(new HttpException('Ошибка сессии', HttpStatus.INTERNAL_SERVER_ERROR));
          else resolve();
        });
      });

      return { 
        message: 'Авторизация успешна',
        user: SessionUser
      };  
    } 

    async logout(req: Request): Promise<string> {
      return new Promise((resolve, reject)=>{
        req.session.destroy((err) =>{
          if(err){
            reject(new HttpException('Ошибка входа', HttpStatus.INTERNAL_SERVER_ERROR));
          } else{
            resolve('Сессия завершена')
          }
        });
      });
    }

    validateSession(req: Request){
      if(!req.session.user){
        throw new HttpException('Сессия не найдена', HttpStatus.UNAUTHORIZED);
      }
      return req.session.user;
    }
  }
