import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DespesaCacheService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atualiza ou cria um registro no cache de despesas mensais
   * @param parceiroId - ID público do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   * @param isFuture - Se a despesa é futura (tem dataVencimento) ou realizada
   */
  async updateDespesaCache(
    parceiroId: string,
    dataDespesa: Date,
    valor: number,
    isFuture: boolean = false
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
        // Se é futura (tem dataVencimento), incrementa to_pay
        // Se não é futura (sem dataVencimento), incrementa realized
        to_pay: isFuture ? { increment: new Decimal(valor) } : undefined,
        realized: !isFuture ? { increment: new Decimal(valor) } : undefined,
      },
      create: {
        // Criar novo registro com os valores corretos
        parceiro_id: parceiroId,
        ym: ym,
        to_pay: isFuture ? new Decimal(valor) : new Decimal(0),
        realized: !isFuture ? new Decimal(valor) : new Decimal(0),
      },
    });
  }

  /**
   * Remove valor do cache quando uma despesa é deletada
   * @param parceiroId - ID público do parceiro
   * @param dataDespesa - Data da despesa
   * @param valor - Valor da despesa
   * @param isFuture - Se a despesa é futura (tem dataVencimento) ou realizada
   */
  async removeDespesaFromCache(
    parceiroId: string,
    dataDespesa: Date,
    valor: number,
    isFuture: boolean = false
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
        console.warn(`Cache entry not found for parceiro ${parceiroId} and ym ${ym}`);
        return;
      }

      // Calcular novos valores garantindo que não fiquem negativos
      const currentToPayValue = Number(currentRecord.to_pay);
      const currentRealizedValue = Number(currentRecord.realized);
      
      const newToPay = isFuture 
        ? Math.max(0, currentToPayValue - valor)
        : currentToPayValue;
      
      const newRealized = !isFuture 
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
          to_pay: new Decimal(newToPay),
          realized: new Decimal(newRealized),
        },
      });
    } catch (error) {
      console.warn(`Error updating cache for parceiro ${parceiroId} and ym ${ym}:`, error);
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
    parceiroId: string,
    dataDespesa: Date,
    valor: number,
    oldIsFuture: boolean,
    newIsFuture: boolean
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
        console.warn(`Cache entry not found for parceiro ${parceiroId} and ym ${ym}`);
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
    } catch (error) {
      console.warn(`Error updating despesa status in cache for parceiro ${parceiroId} and ym ${ym}:`, error);
    }
  }

  /**
   * Busca dados do cache para um parceiro e período específico
   * @param parceiroId - ID público do parceiro
   * @param ym - Ano e mês no formato YYYYMM
   */
  async findByParceiroAndPeriod(parceiroId: string, ym: string) {
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
  async findByParceiro(parceiroId: string) {
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
