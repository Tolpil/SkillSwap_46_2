import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendConfirmationDto } from './dto/resend-confirmation.dto';

export function ApiAuthLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Вход пользователя в систему' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description:
        'Успешный вход. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
    }),
    ApiResponse({ status: 401, description: 'Неверный email или пароль' }),
  );
}

export function ApiAuthRefresh() {
  return applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({ summary: 'Обновление пары токенов' }),
    ApiResponse({
      status: 200,
      description: 'Токены обновлены и установлены в httpOnly cookies',
    }),
    ApiResponse({
      status: 401,
      description:
        'Refresh token отсутствует, невалиден или пользователь не авторизован',
    }),
  );
}

export function ApiAuthLogout() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Выход пользователя из системы' }),
    ApiResponse({
      status: 200,
      description:
        'Пользователь вышел из системы, токены удалены, cookies очищены',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiAuthRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация нового пользователя' }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description:
        'Пользователь создан. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
    }),
    ApiResponse({
      status: 400,
      description: 'Ошибка валидации или город с таким ID не найден',
    }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким email уже существует',
    }),
  );
}

export function ApiAuthCheckUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Проверка существования пользователя' }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Пользователь найден и пароль корректен',
    }),
    ApiResponse({ status: 401, description: 'Неверный email или пароль' }),
  );
}

export function ApiAuthForgotPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Запрос ссылки для восстановления пароля' }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({
      status: 200,
      description:
        'Письмо со ссылкой отправлено (ответ одинаковый независимо от наличия аккаунта)',
    }),
  );
}

export function ApiAuthResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Сброс пароля по одноразовому токену' }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Пароль успешно изменён, все сессии завершены',
    }),
    ApiResponse({
      status: 400,
      description: 'Ссылка недействительна, истекла или пользователь не найден',
    }),
  );
}

export function ApiAuthConfirmEmail() {
  return applyDecorators(
    ApiOperation({ summary: 'Подтверждение email по токену из письма' }),
    ApiBody({ type: ConfirmEmailDto }),
    ApiResponse({ status: 200, description: 'Email подтверждён' }),
    ApiResponse({
      status: 400,
      description: 'Ссылка недействительна, истекла или пользователь не найден',
    }),
  );
}

export function ApiAuthResendConfirmation() {
  return applyDecorators(
    ApiOperation({ summary: 'Повторная отправка письма подтверждения' }),
    ApiBody({ type: ResendConfirmationDto }),
    ApiResponse({ status: 200, description: 'Письмо отправлено' }),
  );
}
