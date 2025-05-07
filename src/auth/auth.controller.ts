import { Controller, Post, Body, Req, HttpException, UnauthorizedException, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { SessionUser, AuthResponse } from './interfaces/auth.interface';
import * as cookieParser from 'cookie-parser';

@Controller('api') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    try {
      const existingUser = await this.authService.findUser(body.username);
      if (existingUser) {
        throw new HttpException('Пользователь уже существует', HttpStatus.BAD_REQUEST);
      }
  
      const result = await this.authService.register(body.username, body.password);
      return {
        status: 'success',
        user: JSON.parse(result)
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Post('authorization')
  async login(
    @Body() body: { username: string; password: string }, 
    @Req() req: Request) {
      const result = await this.authService.login(body.username, body.password, req);
      return result; 
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy(err => {
          if (err) {
            console.error('Ошибка удаления сессии:', err);
            reject(new HttpException('Ошибка выхода', HttpStatus.INTERNAL_SERVER_ERROR));
          } else {
            resolve();
          }
        });
      });
  
      res.clearCookie('connect.sid', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' 
      });
  
      return res.status(200).json({ 
        status: 'success',
        message: 'Сессия завершена' 
      });
    } catch (error) {
      console.error('Ошибка в logout:', error);
      throw new HttpException('Ошибка выхода', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('session/init')
  async initSession(
    @Body() body: {username:string},
    @Req() req: Request
  ){
    const user = await this.authService.findUser(body.username);
    if(!user){
      throw new UnauthorizedException('Пользователь не найден');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      loggedInAt: new Date()
    };

    return{message: 'Сессия инициализирована'}
  }
}