import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth/auth.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      this.authService.validateSession(req);
      next();
    } catch (error) {
      res.status(401).json({ message: 'Сессия истекла', redirect: '/autorization' });
    }
  }
}