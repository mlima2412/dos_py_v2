import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LancamentoDreService, ProcessarVendaResult } from './lancamento-dre.service';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Lançamentos DRE')
@ApiBearerAuth()
@Controller('lancamento-dre')
export class LancamentoDreController {
  constructor(private readonly lancamentoDreService: LancamentoDreService) {}

  @Get('anos')
  @ApiOperation({ summary: 'Lista anos disponíveis com lançamentos DRE' })
  async getAnosDisponiveis(@ParceiroId() parceiroId: number) {
    return this.lancamentoDreService.listarAnosDisponiveis(parceiroId);
  }

  @Get('meses/:ano')
  @ApiOperation({ summary: 'Lista meses disponíveis com lançamentos DRE para um ano' })
  async getMesesDisponiveis(
    @ParceiroId() parceiroId: number,
    @Param('ano', ParseIntPipe) ano: number,
  ) {
    return this.lancamentoDreService.listarMesesDisponiveis(parceiroId, ano);
  }

  @Get('resumo')
  @ApiOperation({ summary: 'Gera resumo DRE para um período' })
  @ApiQuery({ name: 'dataInicio', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'dataFim', required: true, type: String, example: '2024-12-31' })
  async getResumoDRE(
    @ParceiroId() parceiroId: number,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    return this.lancamentoDreService.gerarResumoDRE(
      parceiroId,
      new Date(dataInicio),
      new Date(dataFim),
    );
  }

  @Get('lancamentos')
  @ApiOperation({ summary: 'Lista lançamentos DRE por período' })
  @ApiQuery({ name: 'dataInicio', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'dataFim', required: true, type: String, example: '2024-12-31' })
  async getLancamentos(
    @ParceiroId() parceiroId: number,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    return this.lancamentoDreService.buscarLancamentosPorPeriodo(
      parceiroId,
      new Date(dataInicio),
      new Date(dataFim),
    );
  }

  @Post('processar-venda/:vendaId')
  @ApiOperation({ summary: 'Processa uma venda e cria lançamentos DRE' })
  async processarVenda(
    @ParceiroId() parceiroId: number,
    @Param('vendaId', ParseIntPipe) vendaId: number,
  ): Promise<ProcessarVendaResult> {
    return this.lancamentoDreService.processarVenda(parceiroId, vendaId);
  }

  @Post('processar-despesa/:despesaId')
  @ApiOperation({ summary: 'Processa uma despesa e cria lançamento DRE' })
  async processarDespesa(
    @ParceiroId() parceiroId: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
  ) {
    const lancamentoId = await this.lancamentoDreService.processarDespesa(parceiroId, despesaId);
    return { lancamentoId };
  }

  @Post('criar-regras-padrao')
  @ApiOperation({ summary: 'Cria regras de lançamento automático padrão para vendas' })
  async criarRegrasPadrao(@ParceiroId() parceiroId: number) {
    return this.lancamentoDreService.criarRegrasVendaPadrao(parceiroId);
  }

  @Post('reprocessar-vendas')
  @ApiOperation({ summary: 'Reprocessa todas as vendas para criar lançamentos DRE' })
  async reprocessarVendas(@ParceiroId() parceiroId: number) {
    return this.lancamentoDreService.reprocessarTodasVendas(parceiroId);
  }
}
