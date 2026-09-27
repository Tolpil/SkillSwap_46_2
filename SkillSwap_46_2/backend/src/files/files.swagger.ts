import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';

/**
 * Documentation-only класс: описывает схему multipart-формы для Swagger.
 * В обработке запроса не участвует — тело разбирает Multer,
 * а контроллер получает файл через @UploadedFile().
 * Не экспортируется намеренно: нужен только документации.
 */
class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Файл изображения: jpeg, png, webp или gif, до 2 МБ',
  })
  file: string;
}

export function ApiFilesUpload() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Загрузка изображения',
      description:
        'Принимает изображения jpeg, png, webp, gif размером до 2 МБ. ' +
        'Файл сохраняется в public/uploads под уникальным именем (UUID + исходное расширение). ' +
        'Ответ содержит публичный url для использования в avatar и skills.images',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: FileUploadDto }),
    ApiResponse({
      status: 201,
      description: 'Файл загружен: { url: "/public/uploads/<имя файла>" }',
    }),
    ApiResponse({ status: 400, description: 'Файл не был передан' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 415,
      description:
        'Неподдерживаемый тип файла: разрешены только jpeg, png, webp, gif',
    }),
  );
}
