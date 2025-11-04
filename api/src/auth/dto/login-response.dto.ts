import { ApiProperty } from '@nestjs/swagger';

class PerfilDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Admin' })
  nome: string;
}

class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '01234567-89ab-cdef-0123-456789abcdef' })
  publicId: string;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  email: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  telefone?: string;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ type: PerfilDto })
  perfil: PerfilDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  // Não expor refreshToken no Swagger (usado apenas internamente)
  refreshToken?: string;
}
