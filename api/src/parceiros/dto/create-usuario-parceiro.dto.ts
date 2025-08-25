import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateUsuarioParceiroDto {
  @ApiProperty({
    description: 'ID do perfil',
    example: 1,
    required: true,
  })
  @IsInt()
  @IsPositive()
  perfilId: number;
  @ApiProperty({
    description: 'ID do usuário',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  usuarioId: number;

  @ApiProperty({
    description: 'ID do parceiro',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  parceiroId: number;
}
