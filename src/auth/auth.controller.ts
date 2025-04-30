import { Controller, Post, Body, Req, HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { SessionUser, AuthResponse } from './interfaces/auth.interface';

@Controller('api') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    try {
      const result = await this.authService.register(body.username, body.password);
      return { 
        status: 'success',
        user: JSON.parse(result)
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
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
  async logout(@Req() req: Request) {
    try {
      const result = await this.authService.logout(req);
      return { message: result };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Ошибка сервера', 500);
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