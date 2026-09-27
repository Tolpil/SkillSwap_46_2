import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const CSRF_COOKIE = 'skillswap_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = new Set<string>(['GET', 'HEAD', 'OPTIONS']);

/**
 * Постоянное сравнение двух строк без раннего выхода по длине префикса.
 * Используется для защиты от timing-атак при проверке CSRF-токена.
 */
export function tokensMatch(
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken),
  );
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function getOrCreateCsrfToken(req: Request, res: Response): string {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  const existing = cookies[CSRF_COOKIE];

  if (existing) {
    return existing;
  }

  const token = generateCsrfToken();

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return token;
}

/**
 * Защита от CSRF для cookie-аутентификации (double-submit pattern).
 *
 * Схема работы:
 * 1. При первом обращении сервер кладёт случайный токен в не-httpOnly куку.
 * 2. Клиент обязан вернуть этот же токен в заголовке x-csrf-token.
 * 3. Сторонний сайт не может прочитать нашу куку и подставить заголовок,
 *    поэтому поддельные запросы будут отклонены с 403.
 *
 * В development/test окружении проверка отключена, чтобы не мешать
 * локальной разработке и интеграционным тестам.
 */
export function createCsrfMiddleware(
  enabled = process.env.NODE_ENV === 'production',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!enabled) {
      next();
      return;
    }

    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const cookieToken = getOrCreateCsrfToken(req, res);
    const headerToken = req.get(CSRF_HEADER);

    if (!tokensMatch(cookieToken, headerToken)) {
      res.status(403).json({
        statusCode: 403,
        message: 'Невалидный CSRF-токен',
      });
      return;
    }

    next();
  };
}

export const csrfMiddleware = createCsrfMiddleware();