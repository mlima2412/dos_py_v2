// src/rollup/rollup-despesas-cache.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

type RollupDTO = {
  parceiro_id: number;
  ym: string; // "YYYYMM"
  realized: string; // string p/ evitar problemas de float no front
  to_pay: string;
};

type RollupYearDTO = {
  parceiro_id: number;
  year: string; // "YYYY"
  realized: string;
  to_pay: string;
  average_month: string; // média mensal do ano
  pending_count: number; // número de contas pendentes
};

@Injectable()
export class RollupDespesasCacheService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  private key(parceiroId: string, ym: string) {
    // ajuste o prefixo conforme seu projeto
    return `app:dospy:${parceiroId}:exp:${ym}:despesa`;
  }

  private keyYear(parceiroId: string, year: string) {
    return `app:dospy:${parceiroId}:exp:${year}:despesa-ano`;
  }

  /** SEMPRE lê do Postgres (bypassa cache) */
  private async loadFromDB(parceiroId: number, ym: string): Promise<RollupDTO> {
    const row = await this.prisma.rollupDespesasMensais.findUnique({
      where: { parceiro_id_ym: { parceiro_id: parceiroId, ym } },
      select: { parceiro_id: true, ym: true, realized: true, to_pay: true },
    });

    if (!row) {
      return null;
    }

    return {
      parceiro_id: parceiroId,
      ym,
      realized: row?.realized?.toString() ?? '0.000',
      to_pay: row?.to_pay?.toString() ?? '0.000',
    };
  }

  /** Read-through: tenta Redis; se miss, lê do BD e popula o cache. */
  async get(parceiroId: number, ym: string): Promise<RollupDTO> {
    const key = this.key(parceiroId.toString(), ym);
    const hit = await this.redis.get(key);
    if (hit) return JSON.parse(hit) as RollupDTO;

    const payload = await this.loadFromDB(parceiroId, ym);
    // devolva um rollout padrão
    if (!payload) {
      // não está no redis e nem no banco retorna ZERO
      return {
        parceiro_id: parceiroId,
        ym,
        realized: '0.000',
        to_pay: '0.000',
      };
    }
    await this.redis.set(key, JSON.stringify(payload)); // sem TTL (sempre disponível)
    return payload;
  }

  /** Recalcula no BD e sobrescreve o cache agora (pós-write). */
  async refresh(parceiroId: number, ym: string) {
    const payload = await this.loadFromDB(parceiroId, ym);
    await this.redis.set(
      this.key(parceiroId.toString(), ym),
      JSON.stringify(payload),
    );
  }

  /** Invalida a chave; próximo GET repopula. */
  async invalidate(parceiroId: number, ym: string) {
    await this.redis.del(this.key(parceiroId.toString(), ym));
  }

  async incrYear(parceiroId: number, year: string) {
    const key = `app:dospy:${parceiroId}:exp:despesa-ano`;
    return this.redis.hincrby(key, year, 1);
  }

  async decrYear(parceiroId: number, year: string) {
    const key = `app:dospy:${parceiroId}:exp:despesa-ano`;

    const current = await this.redis.hget(key, year);
    const currentVal = Number(current ?? 0);

    if (currentVal > 0) {
      return this.redis.hincrby(key, year, -1);
    }
  }

  async listYears(parceiroId: number) {
    const key = `app:dospy:${parceiroId}:exp:despesa-ano`;
    const data = await this.redis.hgetall(key);

    // converte para array de objetos
    return Object.entries(data).map(([ano, v]) => ({
      ano,
      total: Number(v),
    }));
  }

  /** Invalida a chave anual; próximo GET repopula. */
  async invalidateYear(parceiroId: number, year: string) {
    await this.redis.del(this.keyYear(parceiroId.toString(), year));
  }

  /** Calcula dados anuais a partir dos dados mensais do Redis */
  async loadYearFromRedis(
    parceiroId: number,
    year: string,
  ): Promise<RollupYearDTO> {
    const months = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ];
    const monthlyData: RollupDTO[] = [];

    // Busca dados de todos os meses do ano no Redis
    for (const month of months) {
      const ym = `${year}${month}`;
      try {
        const monthData = await this.get(parceiroId, ym);
        // Só adiciona se tem dados reais (não é o fallback de zeros)
        if (Number(monthData.realized) > 0 || Number(monthData.to_pay) > 0) {
          monthlyData.push(monthData);
        }
      } catch (error) {
        // Se não encontrar dados para o mês, continua
        console.warn(`Dados não encontrados para ${ym}:`, error);
      }
    }

    const totalRealized = monthlyData.reduce(
      (sum, data) => sum + Number(data.realized),
      0,
    );
    const totalToPay = monthlyData.reduce(
      (sum, data) => sum + Number(data.to_pay),
      0,
    );
    const monthsWithData = monthlyData.length;
    // Média mensal baseada apenas nos meses com dados, ou nos 12 meses se não há dados
    const averageMonth =
      monthsWithData > 0 ? totalRealized / Math.max(monthsWithData, 1) : 0;
    // Contar número de contas pendentes (quantos meses têm valores a pagar > 0)
    const pendingCount = monthlyData.filter(
      data => Number(data.to_pay) > 0,
    ).length;

    return {
      parceiro_id: parceiroId,
      year,
      realized: totalRealized.toFixed(3),
      to_pay: totalToPay.toFixed(3),
      average_month: averageMonth.toFixed(3),
      pending_count: pendingCount,
    };
  }
}
