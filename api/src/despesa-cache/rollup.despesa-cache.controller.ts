// src/rollup/rollup.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { RollupDespesasCacheService } from './rollup-despesas-cache.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Cash')
@Controller('dashboard/despesas')
export class RollupController {
  constructor(private readonly cache: RollupDespesasCacheService) {}

  @Get('mes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo mensal de despesas' })
  async getSummary(
    @Query('parceiroId') parceiroId: string,
    @Query('ym') ym: string, // "YYYYMM"
  ) {
    return this.cache.get(Number(parceiroId), ym); // cache-aside
  }

  @Get('ano')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter resumo anual de despesas e média mensal' })
  async getYearSummary(
    @Query('parceiroId') parceiroId: string,
    @Query('year') year: string, // "YYYY"
  ) {
    return this.cache.loadYearFromRedis(Number(parceiroId), year);
  }
}
