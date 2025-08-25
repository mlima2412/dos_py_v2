// src/rollup/rollup.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { RollupDespesasClassificacaoCacheService } from './rollup-despesas-classificacao-cache.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('CashDespesaClassificacao')
@Controller('dashboard/despesas/classificacao')
export class RollupClassificacaoController {
  constructor(
    private readonly cache: RollupDespesasClassificacaoCacheService,
  ) {}

  @Get('classes-ano')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo anual de despesas e média mensal' })
  async getClassesAno(
    @Query('parceiroId') parceiroId: string,
    @Query('yyyy') yyyy: string,
  ) {
    return this.cache.getClassesAno(Number(parceiroId), yyyy); // cache-aside
  }

  @Get('classes-mes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo mensal de despesas e média mensal' })
  async getClassesMes(
    @Query('parceiroId') parceiroId: string,
    @Query('yyyymm') yyyymm: string,
  ) {
    return this.cache.getClassesMes(Number(parceiroId), yyyymm); // cache-aside
  }

  @Get('categoria-mes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo mensal de despesas por categoria e média mensal' })
  async getCategoriaMes(
    @Query('parceiroId') parceiroId: string,
    @Query('yyyymm') yyyymm: string,
  ) {
    return this.cache.getCategoriasMes(Number(parceiroId), yyyymm); // cache-aside
  }

  @Get('categoria-ano')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo anual de despesas e média mensal' })
  async getCategoriaAno(
    @Query('parceiroId') parceiroId: string,
    @Query('yyyy') yyyy: string,
  ) {
    return this.cache.getCategoriasAno(Number(parceiroId), yyyy); // cache-aside
  }
}
