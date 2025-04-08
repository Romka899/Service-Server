import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { NOSQL_DB_PROVIDER } from '../database/nosql.provider';
import * as NoSQL from 'nosql';

interface User {
  username: string;
  password: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(NOSQL_DB_PROVIDER) private readonly db: any,
  ) {}

  private async findUser(username: string): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
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

  async login(username: string, password: string): Promise<{ message: string, user: any }> {
    if (!username || !password) {
      throw new Error('Имя пользователя и пароль обязательны');
    }
  
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
  
      //console.log('Результат поиска:', users);
  
      if (users.length === 0) {
        throw new HttpException('Неверные учетные данные', HttpStatus.UNAUTHORIZED);
      }
    
      return { 
        message: 'Авторизация успешна',
        user: users[0]
      };
      
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      throw new Error('Ошибка сервера при авторизации');
    }
  }
}