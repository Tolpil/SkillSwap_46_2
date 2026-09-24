import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

export function ApiCitiesFindAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Поиск городов по названию (публичный)',
      description:
        'Частичное совпадение по названию без учёта регистра. Возвращает не более 10 городов, отсортированных по алфавиту. Используется фронтендом для селектора города',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description:
        'Строка поиска по названию города. Если не передана — возвращаются первые 10 городов по алфавиту',
      example: 'Мос',
    }),
    ApiResponse({
      status: 200,
      description:
        'Массив городов (не более 10): [{ id, name, region }], отсортированный по названию',
    }),
  );
}

export function ApiCitiesCreate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Создание города (только админ)' }),
    ApiBody({ type: CreateCityDto }),
    ApiResponse({
      status: 201,
      description: 'Город создан: { id, name, region, createdAt, updatedAt }',
    }),
    ApiResponse({ status: 400, description: 'Ошибка валидации' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
    ApiResponse({
      status: 409,
      description: 'Город с таким названием уже существует в этом регионе',
    }),
  );
}

export function ApiCitiesUpdate() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Обновление названия или региона города (только админ)' }),
    ApiParam({ name: 'id', description: 'UUID города', format: 'uuid' }),
    ApiBody({ type: UpdateCityDto }),
    ApiResponse({
      status: 200,
      description: 'Город обновлён: { id, name, region, createdAt, updatedAt }',
    }),
    ApiResponse({ status: 400, description: 'Ошибка валидации' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
    ApiResponse({ status: 404, description: 'Город не найден' }),
    ApiResponse({
      status: 409,
      description: 'Город с таким названием уже существует в этом регионе',
    }),
  );
}

export function ApiCitiesRemove() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({ summary: 'Удаление города (только админ)' }),
    ApiParam({ name: 'id', description: 'UUID города', format: 'uuid' }),
    ApiResponse({ status: 204, description: 'Город удалён' }),
    ApiResponse({
      status: 400,
      description: 'Нельзя удалить город, к которому привязаны пользователи',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Недостаточно прав: требуется роль ADMIN',
    }),
    ApiResponse({ status: 404, description: 'Город не найден' }),
  );
}