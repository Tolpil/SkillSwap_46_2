import { validateEnv } from './env.validation';

function buildValidConfig(): Record<string, string> {
  return {
    PORT: '3000',
    DB_DRIVER: 'postgres',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_NAME: 'skillswap',
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
  };
}

describe('validateEnv', () => {
  it('passes for a valid config', () => {
    const result = validateEnv(buildValidConfig());

    expect(result.PORT).toBe('3000');
  });

  it('throws when required variables are missing', () => {
    const config = buildValidConfig();
    delete config.JWT_ACCESS_SECRET;

    expect(() => validateEnv(config)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when a numeric variable has an invalid format', () => {
    const config = { ...buildValidConfig(), DB_PORT: 'not-a-number' };

    expect(() => validateEnv(config)).toThrow(/DB_PORT/);
  });

  it('accepts optional variables when provided', () => {
    const config = {
      ...buildValidConfig(),
      FRONTEND_URL: 'https://example.com',
      MAIL_HOST: 'smtp.example.com',
    };

    expect(() => validateEnv(config)).not.toThrow();
  });
});