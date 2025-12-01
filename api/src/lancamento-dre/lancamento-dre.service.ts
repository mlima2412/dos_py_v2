import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { uuidv7 } from 'uuidv7';

export interface ProcessarVendaResult {
  lancamentos: number;
  receita: Decimal;
  deducoes: Decimal;
}

@Injectable()
export class LancamentoDreService {
  private readonly logger = new Logger(LancamentoDreService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Processa uma venda e cria os lançamentos DRE correspondentes
   * - Receita Bruta (valor total)
   * - Dedução IVA (percentual sobre valor)
   * - Desconto (se houver)
   */
  async processarVenda(parceiroId: number, vendaId: number): Promise<ProcessarVendaResult> {
    const venda = await this.prisma.venda.findUnique({
      where: { id: vendaId },
      include: { Parceiro: true },
    });

    if (!venda) {
      throw new NotFoundException(`Venda ${vendaId} não encontrada`);
    }

    if (venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Acesso negado: venda pertence a outro parceiro');
    }

    // Remover lançamentos anteriores desta venda (para reprocessamento)
    // IMPORTANTE: deve ser feito ANTES de verificar regras para garantir
    // que lançamentos antigos sejam removidos mesmo se não houver regras ativas
    await this.prisma.lancamentoDRE.deleteMany({
      where: { vendaId: venda.id },
    });

    // Buscar regras de lançamento ativas para este parceiro
    const regras = await this.prisma.regraLancamentoAutomatico.findMany({
      where: {
        parceiroId: venda.parceiroId,
        ativo: true,
        tipoGatilho: 'VENDA_CONFIRMADA',
        OR: [{ tipoVenda: null }, { tipoVenda: venda.tipo }],
      },
      include: {
        conta: true,
        imposto: true,
      },
    });

    if (regras.length === 0) {
      this.logger.warn(
        `Nenhuma regra de lançamento encontrada para parceiro ${venda.parceiroId}`,
      );
      return {
        lancamentos: 0,
        receita: new Decimal(0),
        deducoes: new Decimal(0),
      };
    }

    let totalReceita = new Decimal(0);
    let totalDeducoes = new Decimal(0);
    const lancamentosCriados: number[] = [];

    for (const regra of regras) {
      let valor = new Decimal(0);

      // Determinar o valor base conforme campo de origem
      switch (regra.campoOrigem) {
        case 'valorTotal':
          valor = venda.valorTotal ?? new Decimal(0);
          break;
        case 'valorFrete':
          valor = venda.valorFrete ?? new Decimal(0);
          break;
        case 'valorComissao':
          valor = venda.valorComissao ?? new Decimal(0);
          break;
        case 'desconto':
          valor = venda.desconto ?? new Decimal(0);
          break;
        default:
          valor = venda.valorTotal ?? new Decimal(0);
      }

      // Aplicar percentual se houver (para deduções como IVA)
      if (regra.percentual) {
        valor = valor.mul(regra.percentual).div(100);
      } else if (regra.imposto?.percentual) {
        valor = valor.mul(regra.imposto.percentual).div(100);
      }

      // Só criar lançamento se valor > 0
      if (valor.gt(0)) {
        const lancamento = await this.prisma.lancamentoDRE.create({
          data: {
            publicId: uuidv7(),
            contaDreId: regra.contaDreId,
            parceiroId: venda.parceiroId,
            vendaId: venda.id,
            dataLancamento: venda.dataVenda,
            valor,
            descricao: `${regra.nome} - Venda #${venda.id}`,
            tipoOrigem: 'VENDA',
          },
        });

        lancamentosCriados.push(lancamento.id);

        // Classificar como receita ou dedução
        const grupoCodigo = regra.conta.grupoId;
        const grupo = await this.prisma.grupoDRE.findUnique({
          where: { id: grupoCodigo },
        });

        if (grupo?.tipo === 'RECEITA') {
          totalReceita = totalReceita.add(valor);
        } else if (grupo?.tipo === 'DEDUCAO') {
          totalDeducoes = totalDeducoes.add(valor);
        }
      }
    }

    this.logger.log(
      `Venda ${vendaId} processada: ${lancamentosCriados.length} lançamentos, ` +
        `Receita: ${totalReceita}, Deduções: ${totalDeducoes}`,
    );

    return {
      lancamentos: lancamentosCriados.length,
      receita: totalReceita,
      deducoes: totalDeducoes,
    };
  }

  /**
   * Processa uma despesa e cria o lançamento DRE correspondente
   */
  async processarDespesa(parceiroId: number, despesaId: number): Promise<number | null> {
    const despesa = await this.prisma.despesa.findUnique({
      where: { id: despesaId },
      include: { contaDre: true },
    });

    if (!despesa) {
      throw new NotFoundException(`Despesa ${despesaId} não encontrada`);
    }

    if (despesa.parceiroId !== parceiroId) {
      throw new ForbiddenException('Acesso negado: despesa pertence a outro parceiro');
    }

    if (!despesa.contaDreId) {
      this.logger.warn(`Despesa ${despesaId} não tem contaDreId definido`);
      return null;
    }

    // Remover lançamento anterior (para reprocessamento)
    await this.prisma.lancamentoDRE.deleteMany({
      where: { despesaId: despesa.id },
    });

    const lancamento = await this.prisma.lancamentoDRE.create({
      data: {
        publicId: uuidv7(),
        contaDreId: despesa.contaDreId,
        parceiroId: despesa.parceiroId,
        despesaId: despesa.id,
        dataLancamento: despesa.dataRegistro,
        valor: despesa.valorTotal,
        descricao: despesa.descricao,
        tipoOrigem: 'DESPESA',
      },
    });

    this.logger.log(`Despesa ${despesaId} processada: lançamento ${lancamento.id}`);

    return lancamento.id;
  }

  /**
   * Remove lançamentos DRE associados a uma despesa
   * Deve ser chamado antes de deletar a despesa
   */
  async removerLancamentoDespesa(parceiroId: number, despesaId: number): Promise<number> {
    const result = await this.prisma.lancamentoDRE.deleteMany({
      where: {
        despesaId,
        parceiroId,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Removidos ${result.count} lançamentos DRE da despesa ${despesaId}`);
    }

    return result.count;
  }

  /**
   * Busca lançamentos DRE por período para montar o relatório
   */
  async buscarLancamentosPorPeriodo(
    parceiroId: number,
    dataInicio: Date,
    dataFim: Date,
  ) {
    return this.prisma.lancamentoDRE.findMany({
      where: {
        parceiroId,
        dataLancamento: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        conta: {
          include: { grupo: true },
        },
      },
      orderBy: [
        { conta: { grupo: { ordem: 'asc' } } },
        { conta: { ordem: 'asc' } },
        { dataLancamento: 'asc' },
      ],
    });
  }

  /**
   * Lista anos disponíveis com lançamentos DRE
   */
  async listarAnosDisponiveis(parceiroId: number): Promise<{ ano: string }[]> {
    const result = await this.prisma.$queryRaw<{ ano: string }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM data_lancamento)::text as ano
      FROM lancamento_dre
      WHERE parceiro_id = ${parceiroId}
      ORDER BY ano DESC
    `;
    return result;
  }

  /**
   * Lista meses disponíveis com lançamentos DRE para um ano específico
   */
  async listarMesesDisponiveis(
    parceiroId: number,
    ano: number,
  ): Promise<{ mes: number }[]> {
    const result = await this.prisma.$queryRaw<{ mes: number }[]>`
      SELECT DISTINCT EXTRACT(MONTH FROM data_lancamento)::int as mes
      FROM lancamento_dre
      WHERE parceiro_id = ${parceiroId}
        AND EXTRACT(YEAR FROM data_lancamento) = ${ano}
      ORDER BY mes ASC
    `;
    return result;
  }

  /**
   * Gera resumo DRE agrupado por conta para um período
   * Retorna no formato esperado pelo frontend
   */
  async gerarResumoDRE(parceiroId: number, dataInicio: Date, dataFim: Date) {
    const lancamentosDb = await this.buscarLancamentosPorPeriodo(
      parceiroId,
      dataInicio,
      dataFim,
    );

    // Agrupar por conta DRE
    const resumoPorConta = new Map<
      number,
      {
        contaDreId: number;
        contaNome: string;
        grupoId: number;
        grupoNome: string;
        grupoCodigo: string;
        grupoTipo: string;
        total: Decimal;
      }
    >();

    // Totais por tipo de grupo
    let totalReceitas = new Decimal(0);
    let totalDeducoes = new Decimal(0);
    let totalCustos = new Decimal(0);
    let totalDespesas = new Decimal(0);

    for (const lanc of lancamentosDb) {
      const grupo = lanc.conta.grupo;
      const conta = lanc.conta;

      if (!resumoPorConta.has(conta.id)) {
        resumoPorConta.set(conta.id, {
          contaDreId: conta.id,
          contaNome: conta.nome,
          grupoId: grupo.id,
          grupoNome: grupo.nome,
          grupoCodigo: grupo.codigo,
          grupoTipo: grupo.tipo,
          total: new Decimal(0),
        });
      }

      const contaData = resumoPorConta.get(conta.id)!;
      contaData.total = contaData.total.add(lanc.valor);

      // Acumular totais por tipo
      switch (grupo.tipo) {
        case 'RECEITA':
          totalReceitas = totalReceitas.add(lanc.valor);
          break;
        case 'DEDUCAO':
          totalDeducoes = totalDeducoes.add(lanc.valor);
          break;
        case 'CUSTO':
          totalCustos = totalCustos.add(lanc.valor);
          break;
        case 'DESPESA':
          totalDespesas = totalDespesas.add(lanc.valor);
          break;
      }
    }

    // Calcular totais derivados
    const receitaLiquida = totalReceitas.sub(totalDeducoes);
    const lucroBruto = receitaLiquida.sub(totalCustos);
    const lucroOperacional = lucroBruto.sub(totalDespesas);

    // Converter para array ordenado
    const lancamentos = Array.from(resumoPorConta.values())
      .sort((a, b) => {
        // Ordenar por grupo primeiro, depois por conta
        if (a.grupoId !== b.grupoId) {
          return a.grupoId - b.grupoId;
        }
        return a.contaDreId - b.contaDreId;
      })
      .map((l) => ({
        ...l,
        total: Number(l.total),
      }));

    return {
      periodo: {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      },
      lancamentos,
      totais: {
        receitas: Number(totalReceitas),
        deducoes: Number(totalDeducoes),
        receitaLiquida: Number(receitaLiquida),
        custos: Number(totalCustos),
        lucroBruto: Number(lucroBruto),
        despesas: Number(totalDespesas),
        lucroOperacional: Number(lucroOperacional),
      },
    };
  }
}
