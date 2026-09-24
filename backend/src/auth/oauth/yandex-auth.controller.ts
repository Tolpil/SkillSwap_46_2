import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from '../auth.service';
import { RequestWithOAuthUser } from '../auth.types';
import { jwtConfig } from '../../config/jwt.config';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';
import { YandexAuthGuard } from './yandex-auth.guard';
import { isYandexOAuthConfigured } from './yandex-oauth.utils';

type YandexOAuthStatus = {
  enabled: boolean;
};

@Controller('auth/yandex')
export class YandexAuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Inject(yandexOAuthConfig.KEY)
    private readonly yandexConfiguration: ConfigType<typeof yandexOAuthConfig>,
  ) {}

  @Get('status')
  status(): YandexOAuthStatus {
    return {
      enabled: isYandexOAuthConfigured(this.yandexConfiguration),
    };
  }

  @Get()
  @UseGuards(YandexAuthGuard)
  login(): void {}

  @Get('callback')
  @UseGuards(YandexAuthGuard)
  async callback(
    @Req() req: RequestWithOAuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.loginWithOAuth(req.user);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${this.yandexConfiguration.frontendUrl}/login?oauth=success`);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: this.jwtConfiguration.accessExpiresIn * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: this.jwtConfiguration.refreshExpiresIn * 1000,
    });
  }
}
