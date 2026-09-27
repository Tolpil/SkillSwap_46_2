import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CSRF_COOKIE,
  generateCsrfToken,
} from './common/middleware/csrf.middleware';
import { AppService, HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }

  @Get('csrf-token')
  getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { csrfToken: string } {
    const cookies = (req.cookies ?? {}) as Record<string, string>;
    const existing = cookies[CSRF_COOKIE];

    if (!existing) {
      res.cookie(CSRF_COOKIE, generateCsrfToken(), {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }

    return { csrfToken: existing || cookies[CSRF_COOKIE] };
  }
}
