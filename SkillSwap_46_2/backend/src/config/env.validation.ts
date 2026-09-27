import { plainToInstance } from 'class-transformer';
import {
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

/**
 * Класс-описание переменных окружения. Применяется при старте приложения:
 * если обязательные переменные отсутствуют или имеют некорректный формат,
 * процесс завершится с понятным списком ошибок, а не упадёт в рантайме.
 */
class EnvironmentVariables {
  @IsNumberString()
  PORT: string;

  @IsString()
  DB_DRIVER: string;

  @IsString()
  DB_HOST: string;

  @IsNumberString()
  DB_PORT: string;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  // ---- Опциональные настройки ----

  @IsOptional()
  @IsNumberString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumberString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  MAIL_HOST?: string;

  @IsOptional()
  @IsNumberString()
  MAIL_PORT?: string;

  @IsOptional()
  @IsString()
  MAIL_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_PASSWORD?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM?: string;

  @IsOptional()
  @IsString()
  YANDEX_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  YANDEX_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  YANDEX_CALLBACK_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const constraints = Object.values(error.constraints ?? {}).join(', ');
        return `${error.property}: ${constraints}`;
      })
      .join('; ');

    throw new Error(`Ошибка валидации переменных окружения: ${details}`);
  }

  return validated;
}