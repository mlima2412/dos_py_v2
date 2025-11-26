import { Injectable } from '@nestjs/common';
import { VendaTipo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { RollupVendasCacheService } from './rollup-vendas-cache.service';

@Injectable()
export class VendaRollupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rollupCache: RollupVendasCacheService,
  ) {}

  private formatYm(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }

  private normalizeDecimal(value: Decimal | number | string) {
    if (value instanceof Decimal) {
      return value;
    }
    return new Decimal(value ?? 0);
  }

  private hasPositiveValue(value: Decimal | number | string | null | undefined) {
    if (value instanceof Decimal) {
      return value.greaterThan(0);
    }
    if (value === null || value === undefined) {
      return false;
    }
    return Number(value) > 0;
  }

  async applyDelta(params: {
    parceiroId: number;
    dataVenda: Date;
    tipo: VendaTipo;
    valorDelta: Decimal | number | string;
    quantidadeDelta?: number;
    descontoDelta?: Decimal | number | string;
    descontoCountDelta?: number;
  }) {
    console.log('[VendaRollupService] applyDelta called with:', {
      parceiroId: params.parceiroId,
      dataVenda: params.dataVenda,
      tipo: params.tipo,
      valorDelta: params.valorDelta.toString(),
    });

    const quantidadeDelta = params.quantidadeDelta ?? 1;
    const valorDelta = this.normalizeDecimal(params.valorDelta);
    const descontoDelta = this.normalizeDecimal(params.descontoDelta ?? 0);
    const descontoCountDelta = params.descontoCountDelta ?? 0;
    const ym = this.formatYm(params.dataVenda);
    const year = params.dataVenda.getFullYear().toString();

    await this.prisma.$transaction(async tx => {
      await tx.rollupVendasMensais.upsert({
        where: {
          parceiro_id_ym: {
            parceiro_id: params.parceiroId,
            ym,
          },
        },
        update: {
          valor_total: { increment: valorDelta },
          quantidade: { increment: quantidadeDelta },
          desconto_total: { increment: descontoDelta },
          desconto_count: { increment: descontoCountDelta },
        },
        create: {
          parceiro_id: params.parceiroId,
          ym,
          valor_total: valorDelta,
          quantidade: quantidadeDelta,
          desconto_total: descontoDelta,
          desconto_count: descontoCountDelta,
        },
      });

      await tx.rollupVendasMensaisTipo.upsert({
        where: {
          parceiro_id_ym_tipo: {
            parceiro_id: params.parceiroId,
            ym,
            tipo: params.tipo,
          },
        },
        update: {
          valor_total: { increment: valorDelta },
          quantidade: { increment: quantidadeDelta },
        },
        create: {
          parceiro_id: params.parceiroId,
          ym,
          tipo: params.tipo,
          valor_total: valorDelta,
          quantidade: quantidadeDelta,
        },
      });
    });

    await Promise.all([
      this.rollupCache.refreshMonthly(params.parceiroId, ym),
      this.rollupCache.refreshYear(params.parceiroId, year),
    ]);
  }

  async registerVendaConfirmada(params: {
    parceiroId: number;
    dataVenda: Date;
    tipo: VendaTipo;
    valorTotal: Decimal | number | string | null | undefined;
    descontoTotal?: Decimal | number | string | null | undefined;
  }) {
    console.log('[VendaRollupService] registerVendaConfirmada called with:', {
      parceiroId: params.parceiroId,
      dataVenda: params.dataVenda,
      tipo: params.tipo,
      valorTotal: params.valorTotal?.toString(),
    });

    const valor = params.valorTotal ?? 0;
    const desconto = params.descontoTotal ?? 0;
    const hasDiscount = this.hasPositiveValue(desconto);
    await this.applyDelta({
      parceiroId: params.parceiroId,
      dataVenda: params.dataVenda,
      tipo: params.tipo,
      valorDelta: valor,
      quantidadeDelta: 1,
      descontoDelta: desconto,
      descontoCountDelta: hasDiscount ? 1 : 0,
    });
  }

  async revertVendaConfirmada(params: {
    parceiroId: number;
    dataVenda: Date;
    tipo: VendaTipo;
    valorTotal: Decimal | number | string | null | undefined;
    descontoTotal?: Decimal | number | string | null | undefined;
  }) {
    console.log('[VendaRollupService] revertVendaConfirmada called with:', {
      parceiroId: params.parceiroId,
      dataVenda: params.dataVenda,
      tipo: params.tipo,
      valorTotal: params.valorTotal?.toString(),
    });

    const valor = params.valorTotal ?? 0;
    const delta =
      valor instanceof Decimal
        ? valor.mul(-1)
        : -Number(valor ?? 0);
    const desconto = params.descontoTotal ?? 0;
    const descontoDelta =
      desconto instanceof Decimal
        ? desconto.mul(-1)
        : -Number(desconto ?? 0);
    const hasDiscount = this.hasPositiveValue(desconto);
    await this.applyDelta({
      parceiroId: params.parceiroId,
      dataVenda: params.dataVenda,
      tipo: params.tipo,
      valorDelta: delta,
      quantidadeDelta: -1,
      descontoDelta,
      descontoCountDelta: hasDiscount ? -1 : 0,
    });
  }
}
