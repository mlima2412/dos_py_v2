import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RollupVendasCacheService } from './rollup-vendas-cache.service';

@ApiTags('CashVenda')
@Controller('dashboard/vendas')
export class RollupVendasController {
  constructor(private readonly cache: RollupVendasCacheService) {}

  @Get('mes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo mensal de vendas' })
  @ApiQuery({ name: 'parceiroId', type: Number, required: true })
  @ApiQuery({ name: 'ym', type: String, required: true, description: 'Formato YYYYMM' })
  async getResumoMensal(
    @Query('parceiroId') parceiroId: string,
    @Query('ym') ym: string,
  ) {
    return this.cache.getMonthly(Number(parceiroId), ym);
  }

  @Get('ano')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo anual de vendas' })
  @ApiQuery({ name: 'parceiroId', type: Number, required: true })
  @ApiQuery({ name: 'year', type: String, required: true, description: 'Formato YYYY' })
  async getResumoAnual(
    @Query('parceiroId') parceiroId: string,
    @Query('year') year: string,
  ) {
    return this.cache.getYear(Number(parceiroId), year);
  }

  @Get('anos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar anos disponíveis com vendas' })
  @ApiQuery({ name: 'parceiroId', type: Number, required: true })
  async getAnosDisponiveis(@Query('parceiroId') parceiroId: string) {
    return this.cache.getAvailableYears(Number(parceiroId));
  }
}
