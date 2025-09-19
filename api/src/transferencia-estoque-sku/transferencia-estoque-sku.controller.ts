import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransferenciaEstoqueSkuService } from './transferencia-estoque-sku.service';
import { TransferenciaSkuSimplesDto } from './dto/transferencia-sku-simples.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transferência de Estoque - SKU')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transferencia-estoque-sku')
export class TransferenciaEstoqueSkuController {
  constructor(
    private readonly transferenciaEstoqueSkuService: TransferenciaEstoqueSkuService,
  ) {}

  @Get(':transferenciaPublicId')
  @ApiOperation({
    summary: 'Listar SKUs de uma transferência',
    description:
      'Retorna todos os SKUs de uma transferência específica com nome do produto, cor, tamanho e quantidade.',
  })
  @ApiParam({
    name: 'transferenciaPublicId',
    description: 'Public ID da transferência',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de SKUs da transferência retornada com sucesso',
    type: [TransferenciaSkuSimplesDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  async findByTransferencia(
    @Param('transferenciaPublicId') transferenciaPublicId: string,
  ): Promise<TransferenciaSkuSimplesDto[]> {
    return this.transferenciaEstoqueSkuService.findByTransferenciaPublicId(
      transferenciaPublicId,
    );
  }
}
