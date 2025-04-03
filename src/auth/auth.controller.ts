import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    try {
      const result = await this.authService.register(body.username, body.password);
      return { message: result };
    } catch (error) {
      throw error; 
    }
  }
}