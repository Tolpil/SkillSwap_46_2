import { ConfigType } from '@nestjs/config';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';
import { isYandexOAuthConfigured } from './yandex-oauth.utils';

const createConfig = (
  clientId: string,
  clientSecret: string,
): ConfigType<typeof yandexOAuthConfig> =>
  ({
    clientId,
    clientSecret,
    callbackUrl: 'http://localhost:3000/api/auth/yandex/callback',
    frontendUrl: 'http://localhost:5173',
  }) as ConfigType<typeof yandexOAuthConfig>;

describe('isYandexOAuthConfigured', () => {
  it('возвращает true для полной конфигурации', () => {
    expect(
      isYandexOAuthConfigured(createConfig('client-id', 'client-secret')),
    ).toBe(true);
  });

  it.each([
    ['', 'client-secret'],
    ['client-id', ''],
    ['   ', 'client-secret'],
    ['client-id', '   '],
  ])('возвращает false для неполной конфигурации', (clientId, clientSecret) => {
    expect(isYandexOAuthConfigured(createConfig(clientId, clientSecret))).toBe(
      false,
    );
  });
});
