import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';

export class CreatePedidoCompraDto {
  @ApiProperty({
    description: 'ID do local de entrada do estoque',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  localEntradaId: number;

  @ApiProperty({
    description: 'ID do fornecedor',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  fornecedorId: number;

  @ApiProperty({
    description: 'Data do pedido',
    example: '2024-01-20T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataPedido?: string;

  @ApiProperty({
    description: 'Data de entrega prevista',
    example: '2024-01-20T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataEntrega?: string;

  @ApiProperty({
    description: 'Valor do frete',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  valorFrete?: number;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 1500.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  valorTotal?: number;

  @ApiProperty({
    description: 'Observações do pedido',
    example: 'Pedido urgente',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({
    description: 'Valor da comissão',
    example: 75.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  valorComissao?: number;

  @ApiProperty({
    description: 'Cotação da moeda',
    example: 1.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cotacao?: number;

  @ApiProperty({
    description: 'ID da moeda',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currencyId?: number;

  @ApiProperty({
    description: 'Indica se o pedido é consignado',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  consignado?: boolean;

  // status 1 a 3
  @ApiProperty({
    description: 'Status do pedido (1 a 3)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  status?: number;

  // Nota: parceiroId será obtido automaticamente do header x-parceiro-id
}
