import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { RollupDespesasCacheService } from './rollup-despesas-cache.service';
@Injectable()
export class DespesaCacheService {
  constructor(
    private prisma: PrismaService,
    private rollupDespesasCacheService: RollupDespesasCacheService,
  ) {}
  /**
   * Atualiza ou cria um registro no cache de despesas mensais
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   * @param isFuture - Se a despesa é futura (tem dataVencimento) ou realizada
   * @param classid - ID da categoria
   */
  async updateDespesaCache(
    parceiroId: number,
    dataDespesa: Date,
    valor: number,
    isFuture: boolean = false,
  ): Promise<void> {
    // Formatar ano e mês no formato YYYYMM
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;

    // Usar upsert para criar ou atualizar o registro acumulando valores
    await this.prisma.rollupDespesasMensais.upsert({
      where: {
        parceiro_id_ym: {
          parceiro_id: parceiroId,
          ym: ym,
        },
      },
      update: {
        to_pay: isFuture ? { increment: new Decimal(valor) } : undefined,
        realized: !isFuture ? { increment: new Decimal(valor) } : undefined,
      },
      create: {
        // Criar novo registro com os valores corretos
        parceiro_id: parceiroId,
        to_pay: isFuture ? new Decimal(valor) : new Decimal(0),
        ym: ym,
        realized: !isFuture ? new Decimal(valor) : new Decimal(0),
      },
    });
    await this.rollupDespesasCacheService.refresh(parceiroId, ym);
  }

  /**
   * Atualiza o valor do cache quando uma parcela é marcada como paga
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   */
  async updateParcelaDespesaCache(
    parceiroId: number,
    dataDespesa: Date,
    valor: number,
  ): Promise<void> {
    console.log('updateParcelaDespesaCache', {
      parceiroId,
      dataDespesa,
      valor,
    });
    // Validar parâmetros de entrada
    if (
      !parceiroId ||
      !dataDespesa ||
      valor === undefined ||
      valor === null ||
      isNaN(valor)
    ) {
      console.warn('Invalid parameters for updateParcelaDespesaCache:', {
        parceiroId,
        dataDespesa,
        valor,
      });
      return;
    }

    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;

    try {
      // Buscar o registro atual para verificar os valores
      const currentRecord = await this.prisma.rollupDespesasMensais.findUnique({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
      });

      if (!currentRecord) {
        console.warn(
          `Cache entry not found for parceiro ${parceiroId} and ym ${ym}`,
        );
        return;
      }
      // Ao pagar uma despesa eu preciso decrementar de to_pay e incrementar em realized
      const currentToPayValue = currentRecord.to_pay.minus(new Decimal(valor));
      const currentRealizedValue = currentRecord.realized.plus(
        new Decimal(valor),
      );

      await this.prisma.rollupDespesasMensais.update({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
        data: {
          to_pay: currentToPayValue,
          realized: currentRealizedValue,
        },
      });
      await this.rollupDespesasCacheService.refresh(parceiroId, ym);
    } catch (error) {
      console.warn(
        `Error updating cache for parceiro ${parceiroId} and ym ${ym}:`,
        error,
      );
    }
  }

  /**
   * Remove valor do cache quando uma despesa é deletada
   * @param parceiroId - ID do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   * @param isFuture - Se a despesa é futura (tem dataVencimento) ou realizada
   */
  async removeDespesaFromCache(
    parceiroId: number,
    dataDespesa: Date,
    valor: number,
    pago: boolean = false,
  ): Promise<void> {
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;

    try {
      // Buscar o registro atual para verificar os valores
      const currentRecord = await this.prisma.rollupDespesasMensais.findUnique({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
      });

      if (!currentRecord) {
        console.warn(
          `Cache entry not found for parceiro ${parceiroId} and ym ${ym}`,
        );
        return;
      }

      // Calcular novos valores garantindo que não fiquem negativos
      const currentToPayValue = Number(currentRecord.to_pay);
      const currentRealizedValue = Number(currentRecord.realized);

      const ToPay = !pago
        ? Math.max(0, currentToPayValue - valor)
        : currentToPayValue;

      const Realized = pago
        ? Math.max(0, currentRealizedValue - valor)
        : currentRealizedValue;

      await this.prisma.rollupDespesasMensais.update({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
        data: {
          to_pay: new Decimal(ToPay),
          realized: new Decimal(Realized),
        },
      });
      console.log('Atualizando redis > ', parceiroId, ym);
      await this.rollupDespesasCacheService.refresh(parceiroId, ym);
    } catch (error) {
      console.warn(
        `Error updating cache for parceiro ${parceiroId} and ym ${ym}:`,
        error,
      );
    }
  }

  /**
   * Atualiza o status de uma despesa no cache (futuro/realizado)
   * @param parceiroId - ID público do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   * @param oldIsFuture - Status antigo (se era futura)
   * @param newIsFuture - Novo status (se é futura)
   */
  async updateDespesaStatus(
    parceiroId: number,
    dataDespesa: Date,
    valor: number,
    oldIsFuture: boolean,
    newIsFuture: boolean,
  ): Promise<void> {
    const year = dataDespesa.getFullYear();
    const month = String(dataDespesa.getMonth() + 1).padStart(2, '0');
    const ym = `${year}${month}`;

    try {
      // Buscar o registro atual para verificar os valores
      const currentRecord = await this.prisma.rollupDespesasMensais.findUnique({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
      });

      if (!currentRecord) {
        console.warn(
          `Cache entry not found for parceiro ${parceiroId} and ym ${ym}`,
        );
        return;
      }

      const currentToPayValue = Number(currentRecord.to_pay);
      const currentRealizedValue = Number(currentRecord.realized);

      let newToPay = currentToPayValue;
      let newRealized = currentRealizedValue;

      // Remover do campo antigo
      if (oldIsFuture) {
        newToPay = Math.max(0, currentToPayValue - valor);
      } else {
        newRealized = Math.max(0, currentRealizedValue - valor);
      }

      // Adicionar no campo novo
      if (newIsFuture) {
        newToPay = newToPay + valor;
      } else {
        newRealized = newRealized + valor;
      }

      await this.prisma.rollupDespesasMensais.update({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym: ym,
          },
        },
        data: {
          to_pay: new Decimal(newToPay),
          realized: new Decimal(newRealized),
        },
      });
      await this.rollupDespesasCacheService.refresh(parceiroId, ym);
    } catch (error) {
      console.warn(
        `Error updating despesa status in cache for parceiro ${parceiroId} and ym ${ym}:`,
        error,
      );
    }
  }

  /**
   * Busca dados do cache para um parceiro e período específico
   * @param parceiroId - ID público do parceiro
   * @param ym - Ano e mês no formato YYYYMM
   */
  async findByParceiroAndPeriod(parceiroId: number, ym: string) {
    return this.prisma.rollupDespesasMensais.findUnique({
      where: {
        parceiro_id_ym: {
          parceiro_id: parceiroId,
          ym: ym,
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
