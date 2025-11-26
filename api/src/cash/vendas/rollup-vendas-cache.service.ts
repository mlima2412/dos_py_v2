import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { Prisma, VendaTipo } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type VendaMonthlySummary = {
  parceiro_id: number;
  ym: string;
  valor_total: string;
  quantidade: number;
  desconto_total: string;
  desconto_count: number;
  tipos: {
    tipo: VendaTipo;
    valor_total: string;
    quantidade: number;
  }[];
};

export type VendaYearSummary = {
  parceiro_id: number;
  year: string;
  valor_total: string;
  quantidade: number;
  media_mensal: string;
  desconto_total: string;
  desconto_count: number;
  tipos: {
    tipo: VendaTipo;
    valor_total: string;
    quantidade: number;
  }[];
};

@Injectable()
export class RollupVendasCacheService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  private monthlyKey(parceiroId: number, ym: string) {
    return `app:dospy:${parceiroId}:sales:${ym}:summary`;
  }

  private yearKey(parceiroId: number, year: string) {
    return `app:dospy:${parceiroId}:sales:${year}:annual`;
  }

  private monthlyDiscountKey(parceiroId: number, ym: string) {
    return `app:dospy:${parceiroId}:sales:${ym}:discount`;
  }

  private yearlyDiscountKey(parceiroId: number, year: string) {
    return `app:dospy:${parceiroId}:sales:${year}:discount`;
  }

  private toStringDecimal(value?: Prisma.Decimal | null) {
    if (!value) {
      return '0.000';
    }
    return value.toString();
  }

  private async loadMonthlyFromDB(
    parceiroId: number,
    ym: string,
  ): Promise<VendaMonthlySummary> {
    const [resumo, tipos] = await Promise.all([
      this.prisma.rollupVendasMensais.findUnique({
        where: {
          parceiro_id_ym: {
            parceiro_id: parceiroId,
            ym,
          },
        },
      }),
      this.prisma.rollupVendasMensaisTipo.findMany({
        where: {
          parceiro_id: parceiroId,
          ym,
        },
      }),
    ]);

    return {
      parceiro_id: parceiroId,
      ym,
      valor_total: this.toStringDecimal(resumo?.valor_total),
      quantidade: resumo?.quantidade ?? 0,
      desconto_total: this.toStringDecimal(resumo?.desconto_total),
      desconto_count: resumo?.desconto_count ?? 0,
      tipos: tipos.map(t => ({
        tipo: t.tipo,
        valor_total: this.toStringDecimal(t.valor_total),
        quantidade: t.quantidade,
      })),
    };
  }

  async getMonthly(parceiroId: number, ym: string): Promise<VendaMonthlySummary> {
    const key = this.monthlyKey(parceiroId, ym);
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const payload = await this.loadMonthlyFromDB(parceiroId, ym);
    await this.redis.set(key, JSON.stringify(payload));
    return payload;
  }

  async refreshMonthly(parceiroId: number, ym: string) {
    const payload = await this.loadMonthlyFromDB(parceiroId, ym);
    const key = this.monthlyKey(parceiroId, ym);
    await this.redis.set(key, JSON.stringify(payload));
    await this.redis.hset(this.monthlyDiscountKey(parceiroId, ym), {
      total: payload.desconto_total,
      count: payload.desconto_count.toString(),
    });
    return payload;
  }

  async invalidateMonthly(parceiroId: number, ym: string) {
    await this.redis.del(this.monthlyKey(parceiroId, ym));
  }

  private async loadYearFromDB(
    parceiroId: number,
    year: string,
  ): Promise<VendaYearSummary> {
    const meses = await this.prisma.rollupVendasMensais.findMany({
      where: {
        parceiro_id: parceiroId,
        ym: {
          startsWith: year,
        },
      },
      orderBy: {
        ym: 'asc',
      },
    });

    const totalValor = meses.reduce((sum, row) => {
      return sum + Number(row.valor_total ?? 0);
    }, 0);
    const totalQuantidade = meses.reduce((sum, row) => sum + (row.quantidade ?? 0), 0);
    const totalDesconto = meses.reduce(
      (sum, row) => sum + Number(row.desconto_total ?? 0),
      0,
    );
    const totalDescontoCount = meses.reduce(
      (sum, row) => sum + (row.desconto_count ?? 0),
      0,
    );
    const mesesComDados = meses.length;

    const tipos = await this.prisma.rollupVendasMensaisTipo.findMany({
      where: {
        parceiro_id: parceiroId,
        ym: {
          startsWith: year,
        },
      },
    });

    const agregadoTipos = tipos.reduce((acc, row) => {
      const atual = acc.get(row.tipo) ?? { valor: 0, qtd: 0 };
      atual.valor += Number(row.valor_total ?? 0);
      atual.qtd += row.quantidade ?? 0;
      acc.set(row.tipo, atual);
      return acc;
    }, new Map<VendaTipo, { valor: number; qtd: number }>());

    return {
      parceiro_id: parceiroId,
      year,
      valor_total: totalValor.toFixed(3),
      quantidade: totalQuantidade,
      media_mensal:
        mesesComDados > 0
          ? (totalValor / Math.max(mesesComDados, 1)).toFixed(3)
          : '0.000',
      desconto_total: totalDesconto.toFixed(3),
      desconto_count: totalDescontoCount,
      tipos: Array.from(agregadoTipos.entries()).map(([tipo, info]) => ({
        tipo,
        valor_total: info.valor.toFixed(3),
        quantidade: info.qtd,
      })),
    };
  }

  async getYear(parceiroId: number, year: string): Promise<VendaYearSummary> {
    const key = this.yearKey(parceiroId, year);
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    const payload = await this.loadYearFromDB(parceiroId, year);
    await this.redis.set(key, JSON.stringify(payload));
    return payload;
  }

  async refreshYear(parceiroId: number, year: string) {
    const payload = await this.loadYearFromDB(parceiroId, year);
    await this.redis.set(this.yearKey(parceiroId, year), JSON.stringify(payload));
    await this.redis.hset(this.yearlyDiscountKey(parceiroId, year), {
      total: payload.desconto_total,
      count: payload.desconto_count.toString(),
    });
    return payload;
  }

  async getAvailableYears(parceiroId: number): Promise<{ ano: number }[]> {
    const anos = await this.prisma.rollupVendasMensais.findMany({
      where: {
        parceiro_id: parceiroId,
      },
      select: {
        ym: true,
      },
      distinct: ['ym'],
      orderBy: {
        ym: 'desc',
      },
    });

    // Extrair anos únicos do formato YYYY-MM
    const anosUnicos = new Set<number>();
    anos.forEach(item => {
      const year = parseInt(item.ym.substring(0, 4));
      anosUnicos.add(year);
    });

    return Array.from(anosUnicos)
      .sort((a, b) => b - a) // Ordenar descendente
      .map(ano => ({ ano }));
  }

}
