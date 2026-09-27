import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';
import { isYandexOAuthConfigured } from './yandex-oauth.utils';

@Injectable()
export class YandexAuthGuard extends AuthGuard('yandex') {
  constructor(
    @Inject(yandexOAuthConfig.KEY)
    private readonly yandexConfiguration: ConfigType<typeof yandexOAuthConfig>,
  ) {
    super();
  }

  getAuthenticateOptions(): Record<string, never> {
    if (!isYandexOAuthConfigured(this.yandexConfiguration)) {
      throw new ServiceUnavailableException(
        'Вход через Яндекс временно недоступен. Попробуйте позже.',
      );
    }

    return {};
  }
}
