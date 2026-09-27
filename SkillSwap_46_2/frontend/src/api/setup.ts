import { interceptors } from "./interceptors";

const CSRF_COOKIE = "skillswap_csrf";
const CSRF_HEADER = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Сервер выдаёт CSRF-куку при первом обращении. Если её ещё нет,
// запрашиваем токен один раз и переиспользуем promise до конца сессии.
let csrfPromise: Promise<void> | null = null;

async function ensureCsrfToken(): Promise<void> {
  if (readCookie(CSRF_COOKIE)) {
    return;
  }

  if (!csrfPromise) {
    csrfPromise = fetch("/api/csrf-token", { credentials: "include" })
      .then(() => undefined)
      .finally(() => {
        csrfPromise = null;
      });
  }

  await csrfPromise;
}

export function setupApiInterceptors() {
  // Backend работает на httpOnly-куках. Для мутирующих методов
  // дополнительно отправляем CSRF-токен, чтобы защититься от
  // подделки запросов со сторонних сайтов.
  interceptors.addRequestInterceptor(async (url, config) => {
    const method = (config.method ?? "GET").toUpperCase();

    if (UNSAFE_METHODS.has(method)) {
      await ensureCsrfToken();

      const token = readCookie(CSRF_COOKIE);
      if (token) {
        config.headers = { ...config.headers, [CSRF_HEADER]: token };
      }
    }

    return { url, config };
  });

  interceptors.addResponseInterceptor(async (response) => {
    return response;
  });

  interceptors.addErrorInterceptor(async (error) => {
    return Promise.reject(error);
  });
}