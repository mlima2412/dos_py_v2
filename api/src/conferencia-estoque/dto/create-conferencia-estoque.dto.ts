import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  IsPositive,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum StatusConferencia {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export class CreateConferenciaEstoqueDto {
  @ApiProperty({
    description: 'ID do local de estoque',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  localEstoqueId: number;

  @ApiProperty({
    description: 'ID do usuário responsável pela conferência',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  usuarioResponsavel: number;

  @ApiProperty({
    description: 'Data de início da conferência',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiProperty({
    description: 'Data de fim da conferência',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiProperty({
    description: 'Status da conferência',
    example: 'PENDENTE',
    enum: StatusConferencia,
    default: StatusConferencia.PENDENTE,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusConferencia)
  status?: StatusConferencia;
}
