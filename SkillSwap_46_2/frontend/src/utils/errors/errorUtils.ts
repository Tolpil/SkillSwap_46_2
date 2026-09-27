import type { ErrorResponse, Error } from "./types";
import {
  ErrorCodes,
  ErrorMessages,
  StatusMessages,
  isDefaultBackendMessage,
} from "./errors";

const normalizeBackendMessage = (
  raw: string | string[] | undefined,
): string | null => {
  if (!raw) return null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(raw)) {
    const cleaned = raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);

    return cleaned.length > 0 ? cleaned.join(". ") : null;
  }

  return null;
};

const handleBuisnesError = (error: Error): ErrorResponse => {
  const dictionaryMessage = error.code ? ErrorMessages[error.code] : undefined;
  const rawBackendMessage = normalizeBackendMessage(error.message);
  const backendMessage =
    rawBackendMessage && !isDefaultBackendMessage(rawBackendMessage)
      ? rawBackendMessage
      : null;

  const statusMessage = StatusMessages[error.statusCode];
  
  // если бек прислал код ошибки, то берём сообщение из словаря по этому коду
  // если нет, то берём сообщение от бека как есть (если оно не пустое и не по умолчанию)
  // если осмысленного сообщения от бека нет, то пытаемся найти сообщение по http статусу (или сдаёмся)
  const message =
    dictionaryMessage ??
    backendMessage ??
    statusMessage ??
    "Что-то пошло не так";

  const codeSuffix = error.code ? ErrorCodes[error.code] : undefined;
  const errorCode = codeSuffix
    ? `${error.statusCode}${codeSuffix}`
    : String(error.statusCode);

  return {
    message,
    errorCode,
    originalError: error,
  };
};

export const handleError = (error: unknown): ErrorResponse => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "statusCode" in error
  ) {
    return handleBuisnesError(error as Error);
  }

  return {
    message: "Ошибка соединения с сервером",
    errorCode: "0000000",
    originalError: {
      code: "network:error",
      path: "",
      statusCode: 0,
      timestamp: new Date(),
    } as Error,
  };
};