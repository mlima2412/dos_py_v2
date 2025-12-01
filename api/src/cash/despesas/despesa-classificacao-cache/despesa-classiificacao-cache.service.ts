import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { RollupDespesasClassificacaoCacheService } from './rollup-despesas-classificacao-cache.service';
@Injectable()
export class DespesaClassificacaoCacheService {
  constructor(
    private prisma: PrismaService,
    private rollupDespesasClassificacaoCacheService: RollupDespesasClassificacaoCacheService,
  ) {}
  /**
   * Atualiza ou cria um registro no cache de despesas mensais (categorias antigas)
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param categoriaId - ID da categoria
   * @param classificacaoId - ID da subcategoria
   * @param valor - Valor da despesa
   * @param descricao_classe - Descrição da subcategoria
   * @param descricao_categoria - Descrição da categoria
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
        parceiro_id: parceiroId,
        categoria_id: parseInt(categoriaid),
        sub_categoria_id: parseInt(classid),
        ym: ym,
        realized: valor,
      },
    });

    // Atualizar Redis
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
   * Atualiza ou cria um registro no cache de despesas mensais usando DRE
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param grupoDreId - ID do GrupoDRE (categoria)
   * @param contaDreId - ID da ContaDRE (classificação)
   * @param valor - Valor da despesa
   * @param nomeContaDre - Nome da ContaDRE
   * @param nomeGrupoDre - Nome do GrupoDRE
   */
  async updateDespesaClassificacaoCacheDRE(
    parceiroId: number,
    dataDespesa: Date,
    grupoDreId: number,
    contaDreId: number,
    valor: Decimal,
    nomeContaDre: string,
    nomeGrupoDre: string,
  ): Promise<void> {
    // Formatar ano e mês no formato YYYYMM
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;

    // Usar upsert para criar ou atualizar o registro na tabela DRE
    await this.prisma.rollupDespesasMensaisDRE.upsert({
      where: {
        parceiro_id_ym_grupo_dre_id_conta_dre_id: {
          parceiro_id: parceiroId,
          grupo_dre_id: grupoDreId,
          conta_dre_id: contaDreId,
          ym: ym,
        },
      },
      update: {
        realized: { increment: valor },
      },
      create: {
        parceiro_id: parceiroId,
        grupo_dre_id: grupoDreId,
        conta_dre_id: contaDreId,
        ym: ym,
        realized: valor,
      },
    });

    // Atualizar Redis (usa os mesmos IDs mas com formato padded)
    const categoriaid = String(grupoDreId).padStart(2, '0');
    const classid = String(contaDreId).padStart(2, '0');

    await this.rollupDespesasClassificacaoCacheService.updateClassAggregateDelta(
      parceiroId,
      ym,
      classid,
      categoriaid,
      Number(valor),
      nomeContaDre,
      nomeGrupoDre,
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
   * Remove valor do cache DRE quando uma despesa é deletada
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param grupoDreId - ID do GrupoDRE
   * @param contaDreId - ID da ContaDRE
   * @param valor - Valor da despesa
   */
  async removeDespesaClassificacaoCacheDRE(
    parceiroId: number,
    dataDespesa: Date,
    grupoDreId: number,
    contaDreId: number,
    valor: Decimal,
  ): Promise<void> {
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;
    const categoriaid = String(grupoDreId).padStart(2, '0');
    const classid = String(contaDreId).padStart(2, '0');

    try {
      // Buscar o registro atual para verificar os valores
      const currentRecord =
        await this.prisma.rollupDespesasMensaisDRE.findUnique({
          where: {
            parceiro_id_ym_grupo_dre_id_conta_dre_id: {
              parceiro_id: parceiroId,
              grupo_dre_id: grupoDreId,
              conta_dre_id: contaDreId,
              ym: ym,
            },
          },
        });

      if (!currentRecord) {
        console.warn(
          `DRE Cache entry not found for parceiro ${parceiroId}, ym ${ym}, grupo ${grupoDreId}, conta ${contaDreId}`,
        );
        return;
      }

      // Calcular novo valor garantindo que não fique negativo
      const currentRealizedValue = Number(currentRecord.realized);
      const newRealized = Math.max(0, currentRealizedValue - Number(valor));

      // Atualizar Redis
      await this.rollupDespesasClassificacaoCacheService.updateClassAggregateDelta(
        parceiroId,
        ym,
        classid,
        categoriaid,
        Number(valor) * -1, // passa o valor negativo para decrementar
        '',
        '',
        { clampTotalsAtZero: true, pruneZeroMembers: false },
      );

      // Atualizar banco de dados
      await this.prisma.rollupDespesasMensaisDRE.update({
        where: {
          parceiro_id_ym_grupo_dre_id_conta_dre_id: {
            parceiro_id: parceiroId,
            grupo_dre_id: grupoDreId,
            conta_dre_id: contaDreId,
            ym: ym,
          },
        },
        data: {
          realized: new Decimal(newRealized),
        },
      });
    } catch (error) {
      console.warn(
        `Error updating DRE cache for parceiro ${parceiroId} and ym ${ym}:`,
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
