import { ConfigType } from '@nestjs/config';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';

export const isYandexOAuthConfigured = (
  config: ConfigType<typeof yandexOAuthConfig>,
): boolean => Boolean(config.clientId.trim() && config.clientSecret.trim());
