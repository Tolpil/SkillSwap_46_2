import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ description: 'Одноразовый токен подтверждения из письма' })
  @IsString()
  @IsNotEmpty({ message: 'Токен обязателен' })
  token: string;
}