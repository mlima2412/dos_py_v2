import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { RollupDespesasClassificacaoCacheService } from './rollup-despesas-classificacao-cache.service';
@Injectable()
export class DespesaClassificacaoCacheService {
  constructor(
    private prisma: PrismaService,
    private rollupDespesasClassificacaoCacheService: RollupDespesasClassificacaoCacheService,
  ) {}
  /**
   * Atualiza ou cria um registro no cache de despesas mensais
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param categoriaid -
   * @param classid - ID da categoria
   * @param valor - Valor da despesa
   * @param isFuture - Se a despesa é futura (tem dataVencimento) ou realizada
   */
  async updateDespesaClassificacaoCache(
    parceiroId: number,
    dataDespesa: Date,
    categoriaId: number,
    classificacaoId: number,
    valor: Decimal,
    descricao_classe: string,
    descricao_categoria: string,
  ): Promise<void> {
    // Formatar ano e mês no formato YYYYMM
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const categoriaid = String(categoriaId).padStart(2, '0');
    const classid = String(classificacaoId).padStart(2, '0');
    const ym = `${year}${month}`;

    // Usar upsert para criar ou atualizar o registro acumulando valores
    await this.prisma.rollupDespesasMensaisCategoria.upsert({
      where: {
        parceiro_id_ym_categoria_id_sub_categoria_id: {
          parceiro_id: parceiroId,
          categoria_id: parseInt(categoriaid),
          sub_categoria_id: parseInt(classid),
          ym: ym,
        },
      },
      update: {
        realized: { increment: valor },
      },
      create: {
        // Criar novo registro com os valores corretos
        parceiro_id: parceiroId,
        categoria_id: parseInt(categoriaid),
        sub_categoria_id: parseInt(classid),
        ym: ym,
        realized: valor,
      },
    });
    await this.rollupDespesasClassificacaoCacheService.updateClassAggregateDelta(
      parceiroId,
      ym,
      classid,
      categoriaid,
      Number(valor),
      descricao_classe,
      descricao_categoria,
    );
  }

  /**
   * Remove valor do cache quando uma despesa é deletada
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   */
  async removeDespesaClassificacaoCache(
    parceiroId: number,
    dataDespesa: Date,
    categoriaId: number,
    classificacaoId: number,
    valor: Decimal,
  ): Promise<void> {
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const classid = String(classificacaoId).padStart(2, '0');
    const categoriaid = String(categoriaId).padStart(2, '0');
    const ym = `${year}${month}`;

    try {
      // Buscar o registro atual para verificar os valores
      const currentRecord =
        await this.prisma.rollupDespesasMensaisCategoria.findUnique({
          where: {
            parceiro_id_ym_categoria_id_sub_categoria_id: {
              parceiro_id: parceiroId,
              categoria_id: categoriaId,
              ym: ym,
              sub_categoria_id: parseInt(classid),
            },
          },
          include: {
            Categoria: true,
          },
        });

      if (!currentRecord) {
        console.warn(
          `Cache entry not found for parceiro ${parceiroId} and ym ${ym}`,
        );
        return;
      }

      // Calcular novos valores garantindo que não fiquem negativos
      const currentRealizedValue = Number(currentRecord.realized);
      const Realized = valor
        ? Math.max(0, currentRealizedValue - Number(valor))
        : currentRealizedValue;

      await this.rollupDespesasClassificacaoCacheService.updateClassAggregateDelta(
        parceiroId,
        ym,
        classid,
        categoriaid,
        Number(valor) * -1,  // passa o valor negativo para decrementar.
        '',
        '',
        { clampTotalsAtZero: true, pruneZeroMembers: false },
      );
      await this.prisma.rollupDespesasMensaisCategoria.update({
        where: {
          parceiro_id_ym_categoria_id_sub_categoria_id: {
            parceiro_id: parceiroId,
            categoria_id: categoriaId,
            ym: ym,
            sub_categoria_id: parseInt(classid),
          },
        },
        data: {
          realized: new Decimal(Realized),
        },
      });
    } catch (error) {
      console.warn(
        `Error updating cache for parceiro ${parceiroId} and ym ${ym}:`,
        error,
      );
    }
  }

  /**
   * Busca dados do cache para um parceiro e período específico
   * @param parceiroId - ID público do parceiro
   * @param ym - Ano e mês no formato YYYYMM
   */
  async findByParceiroAndPeriod(
    parceiroId: number,
    ym: string,
    classid: number,
    categoriaId: number,
  ) {
    return this.prisma.rollupDespesasMensaisCategoria.findUnique({
      where: {
        parceiro_id_ym_categoria_id_sub_categoria_id: {
          parceiro_id: parceiroId,
          categoria_id: categoriaId,
          ym: ym,
          sub_categoria_id: classid,
        },
      },
    });
  }

  /**
   * Busca todos os dados do cache para um parceiro
   * @param parceiroId - ID público do parceiro
   */
  async findByParceiro(parceiroId: number) {
    return this.prisma.rollupDespesasMensais.findMany({
      where: {
        parceiro_id: parceiroId,
      },
      orderBy: {
        ym: 'desc',
      },
    });
  }
}
