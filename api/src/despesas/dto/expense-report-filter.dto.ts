import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export enum ReportType {
  SINTETICO = 'sintetico',
  ANALITICO = 'analitico',
}

export class ExpenseReportFilterDto {
  @ApiProperty({
    description: 'Tipo de relatório',
    enum: ReportType,
    example: ReportType.ANALITICO,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Ano para filtrar (opcional, "all" para todos os anos)',
    example: '2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({
    description: 'Mês para filtrar (1-12, opcional)',
    example: 11,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;
}
