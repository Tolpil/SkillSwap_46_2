import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';
import { YandexAuthGuard } from './yandex-auth.guard';

const createConfig = (
  overrides: Partial<ConfigType<typeof yandexOAuthConfig>> = {},
): ConfigType<typeof yandexOAuthConfig> =>
  ({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    callbackUrl: 'http://localhost:3000/api/auth/yandex/callback',
    frontendUrl: 'http://localhost:5173',
    ...overrides,
  }) as ConfigType<typeof yandexOAuthConfig>;

describe('YandexAuthGuard', () => {
  it('разрешает запуск Passport Strategy при настроенном приложении', () => {
    const guard = new YandexAuthGuard(createConfig());

    expect(guard.getAuthenticateOptions()).toEqual({});
  });

  it.each([
    {
      name: 'clientId отсутствует',
      config: { clientId: '' },
    },
    {
      name: 'clientSecret отсутствует',
      config: { clientSecret: '' },
    },
    {
      name: 'параметры содержат только пробелы',
      config: { clientId: '   ', clientSecret: '   ' },
    },
  ])('возвращает HTTP 503, если $name', ({ config }) => {
    const guard = new YandexAuthGuard(createConfig(config));

    expect(() => guard.getAuthenticateOptions()).toThrow(
      new ServiceUnavailableException(
        'Вход через Яндекс временно недоступен. Попробуйте позже.',
      ),
    );
  });
});
