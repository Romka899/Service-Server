import { Controller, Post, Body, Req, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LoginResponse } from './auth.types'; 

@Controller('api') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    console.log('Получен запрос на регистрацию:', body);
    try {
      const result = await this.authService.register(body.username, body.password);
      console.log('Регистрация успешна');
      return { message: result };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message || 'Ошибка сервера', 500);
    }
  }

  @Post('authorization')
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request
  ): Promise<LoginResponse> {
    try {
      return await this.authService.login(body.username, body.password, req);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Ошибка сервера', 500);
    }
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
}