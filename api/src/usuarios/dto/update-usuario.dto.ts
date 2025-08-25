import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiProperty({
    description: 'ID público do usuário para identificação',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @IsString()
  @IsOptional()
  publicId?: string;
}
