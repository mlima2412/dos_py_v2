import { ApiProperty } from '@nestjs/swagger';

export class AjusteConferenciaLoteResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Ajustes processados com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Número de ajustes processados',
    example: 5,
  })
  processados: number;
}
