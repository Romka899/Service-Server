import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { NOSQL_DB_PROVIDER } from '../database/nosql.provider';
import * as NoSQL from 'nosql';
import { Request } from 'express';
import * as crypto from 'crypto';
import { rejects } from 'assert';
import { resolve } from 'path';
import { SessionUser, AuthResponse } from './interfaces/auth.interface';


declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}


@Injectable()
export class AuthService {
  constructor(
    @Inject(NOSQL_DB_PROVIDER) private readonly db: any,
  ) {}
  

  async findUser(username: string): Promise<any> {
    return new Promise((resolve, reject) => {
        this.db.find().make(filter => {
            filter.where('username', username);
            filter.callback((err, users) => {
                if (err) reject(err);
                resolve(users[0] || null);
            });
        });
    });
}

async register(username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!username || !password) {
      return reject(new Error('Имя пользователя и пароль обязательны'));
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const newUser = {
      username,
      password: hashedPassword,
      role: 'user',
      id: crypto.randomBytes(16).toString('hex'),
      createdAt: new Date().toISOString()
    };

    this.db.insert(newUser, (err) => {
      if (err) return reject(new Error('Ошибка базы данных'));
      resolve(JSON.stringify(newUser));
    });
  });
}

async login(username: string, password: string, req: Request): Promise<AuthResponse> {
  const users = await new Promise<any[]>((resolve, reject) => {
    this.db.find().make((filter) => {
      filter.where('username', username);
      filter.where('password', crypto.createHash('sha256').update(password).digest('hex'));
      filter.callback((err, users) => {
        if (err) return reject(err);
        resolve(users);
      });
    });
  });

  if (users.length === 0) {
    throw new HttpException('Неверные учетные данные', HttpStatus.UNAUTHORIZED);
  }

  const user = users[0];
  
  req.session.user = {
    id: user.id, 
    username: user.username,
    role: user.role,
    loggedInAt: new Date()
  };

  await new Promise<void>((resolve) => req.session.save(resolve));
  
  return {
    status: 'success',
    data: {
      user: req.session.user
    }
  };
}

    async validateUser(username: string, password: string): Promise<any> {
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      return new Promise((resolve, reject) => {
        this.db.find().make(filter => {
          filter.where('username', username);
          filter.where('password', hashedPassword);
          filter.callback((err, users) => {
            if (err) return reject(err);
            resolve(users[0] || null);
          });
        });
      });
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
