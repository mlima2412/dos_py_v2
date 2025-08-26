import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaService } from '../../../prisma/prisma.service';

type UpdateOpts = {
  pruneZeroMembers?: boolean; // remove do ZSET se score <= 0
  clampTotalsAtZero?: boolean; // evita total negativo
};

type RollupClassificacaoDTO = {
  parceiro_id: number;
  ym: string;
  categoria_id: number;
  classid: string;
  valor: string;
};

@Injectable()
export class RollupDespesasClassificacaoCacheService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}
  private async loadFromDB(
    parceiroId: number,
    ym: string,
    categoria_id: number,
    classid: string,
  ): Promise<RollupClassificacaoDTO> {
    const row = await this.prisma.rollupDespesasMensaisCategoria.findUnique({
      where: {
        parceiro_id_ym_categoria_id_sub_categoria_id: {
          parceiro_id: parceiroId,
          ym,
          categoria_id: categoria_id,
          sub_categoria_id: parseInt(classid),
        },
      },
      select: {
        parceiro_id: true,
        ym: true,
        sub_categoria_id: true,
        realized: true,
      },
    });
    if (!row) {
      return null;
    }

    return {
      parceiro_id: parceiroId,
      ym,
      valor: row?.realized?.toString() ?? '0.000',
      categoria_id: categoria_id,
      classid: row?.sub_categoria_id?.toString() ?? '0',
    };
  }

  async updateClassAggregateDelta(
    parceiroId: number,
    ym: string, // 'YYYYMM'
    classId: string,
    catId: string,
    valor: number, // +incremento | -decremento (OBRIGATÓRIO)
    nomeClassificacao?: string | null, // opcional: atualiza dict
    nomeCategoria?: string | null, // opcional: atualiza dict
    opts: UpdateOpts = {},
  ) {
    if (!valor) return;

    console.log(
      'updateClassAggregateDelta',
      parceiroId,
      ym,
      classId,
      catId,
      valor,
      nomeClassificacao,
      nomeCategoria,
      opts,
    );
    const yyyy = ym.slice(0, 4);

    // Keys por sub-classificação
    const kMonthByClass = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:class`;
    const kYearByClass = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:class`;
    const kTotMonthCls = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:class:total`;
    const kTotYearCls = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:class:total`;

    // Keys por categoria
    const kMonthByCat = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:cat`;
    const kYearByCat = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:cat`;
    const kTotMonthCat = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:cat:total`;
    const kTotYearCat = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:cat:total`;

    // Dicionários
    const kClassDict = `app:dospy:dict:class`; // value = JSON { nome, catId }
    const kCatDict = `app:dospy:dict:cat`; // value = JSON { nome }

    const tx = this.redis.multi();

    // Sub-classificação
    tx.zincrby(kMonthByClass, valor, classId); // [0]
    tx.zincrby(kYearByClass, valor, classId); // [1]
    tx.incrby(kTotMonthCls, valor); // [2]
    tx.incrby(kTotYearCls, valor); // [3]

    tx.zincrby(kMonthByCat, valor, catId); // [4]
    tx.zincrby(kYearByCat, valor, catId); // [5]
    tx.incrby(kTotMonthCat, valor); // [6]
    tx.incrby(kTotYearCat, valor); // [7]

    // Dicionários (só se fornecidos; nunca apagamos em decremento)
    if (nomeClassificacao && nomeClassificacao.length > 0) {
      tx.hset(
        kClassDict,
        String(classId),
        JSON.stringify({ nome: nomeClassificacao, catId }),
      );
    }
    if (nomeCategoria && nomeCategoria.length > 0) {
      tx.hset(kCatDict, String(catId), JSON.stringify({ nome: nomeCategoria }));
    }

    const res = await tx.exec();

    // (opcional) evitar totais negativos
    if (opts.clampTotalsAtZero) {
      const clampTx = this.redis.multi();
      clampTx.get(kTotMonthCls);
      clampTx.get(kTotYearCls);
      clampTx.get(kTotMonthCat);
      clampTx.get(kTotYearCat);
      const totals = await clampTx.exec();
      const [tM, tY, tMCat, tYCat] = [
        Number(totals?.[0]?.[1] ?? 0),
        Number(totals?.[1]?.[1] ?? 0),
        Number(totals?.[2]?.[1] ?? 0),
        Number(totals?.[3]?.[1] ?? 0),
      ];
      const fix = this.redis.multi();
      if (tM < 0) fix.set(kTotMonthCls, 0);
      if (tY < 0) fix.set(kTotYearCls, 0);
      if (tMCat < 0) fix.set(kTotMonthCat, 0);
      if (tYCat < 0) fix.set(kTotYearCat, 0);
      await fix.exec();
    }

    // (opcional) podar membros com score <= 0
    if (opts.pruneZeroMembers) {
      const rm = this.redis.multi();
      let hasRm = false;

      const newMonthClassScore = Number(res?.[0]?.[1] ?? NaN);
      const newYearClassScore = Number(res?.[1]?.[1] ?? NaN);
      if (!Number.isNaN(newMonthClassScore) && newMonthClassScore <= 0) {
        rm.zrem(kMonthByClass, String(classId));
        hasRm = true;
      }
      if (!Number.isNaN(newYearClassScore) && newYearClassScore <= 0) {
        rm.zrem(kYearByClass, String(classId));
        hasRm = true;
      }

      const newMonthCatScore = Number(res?.[4]?.[1] ?? NaN);
      const newYearCatScore = Number(res?.[5]?.[1] ?? NaN);
      if (!Number.isNaN(newMonthCatScore) && newMonthCatScore <= 0) {
        rm.zrem(kMonthByCat, String(catId));
        hasRm = true;
        if (!Number.isNaN(newYearCatScore) && newYearCatScore <= 0) {
          rm.zrem(kYearByCat, String(catId));
          hasRm = true;
        }
      }

      if (hasRm) await rm.exec();
    }

  }
  async getClassesMes(parceiroId: number, ym: string) {
    const kByClass = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:class`;           // ZSET
    const kTot     = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:class:total`;     // STRING
    const dictKey  = `app:dospy:dict:class`;                                            // HASH (value = JSON { nome, catId })
  
    const total = Number((await this.redis.get(kTot)) ?? 0) || 0;
  
    const rows: string[] = await this.redis.zrevrange(kByClass, 0, -1, 'WITHSCORES');   // [classId, score, ...]
    if (!rows || rows.length === 0) {
      // nada no mês: evita HMGET sem fields
      return { totalCentavos: total, classificacoes: [] };
    }
  
    const ids: string[] = [];
    const valores: number[] = [];
    for (let i = 0; i < rows.length; i += 2) {
      ids.push(rows[i]);
      valores.push(Number(rows[i + 1]));
    }
  
    // ioredis -> hmget(key, ...fields)
    // node-redis v4 -> hmGet(key, fieldsArray)
    let rawMeta: (string | null)[] = [];
    if (ids.length > 0) {
      if (typeof (this.redis as any).hmget === 'function') {
        rawMeta = await (this.redis as any).hmget(dictKey, ...ids);
      } else if (typeof (this.redis as any).hmGet === 'function') {
        rawMeta = await (this.redis as any).hmGet(dictKey, ids);
      }
    }
  
    const classificacoes = ids.map((id, i) => {
      let meta: any = null;
      try {
        meta = rawMeta?.[i] ? JSON.parse(rawMeta[i] as string) : null;
      } catch {
        meta = null;
      }
      const v = valores[i];
      return {
        classificacaoId: Number(id),
        nome: meta?.nome ?? null,
        catId: meta?.catId ?? null,
        valorCentavos: v,
        percentual: total ? v / total : 0,
      };
    });
  
    return { totalCentavos: total, classificacoes };
  }
  
// Retorna todas as categorias de um mês, já ordenadas (maior -> menor)
// Formato: { totalCentavos, categorias: [{ catId, nome, valorCentavos, percentual }] }
async getCategoriasMes(parceiroId: number, ym: string) {
  const kByCat   = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:cat`;          // ZSET
  const kTot     = `app:dospy:{${parceiroId}}:exp:sum:month:${ym}:by:cat:total`;    // STRING
  const dictKey  = `app:dospy:dict:cat`;                                            // HASH (value = JSON { nome })

  const totalCentavos = Number((await this.redis.get(kTot)) ?? 0) || 0;

  const rows: string[] = await this.redis.zrevrange(kByCat, 0, -1, 'WITHSCORES');   // [catId, score, ...]
  if (!rows || rows.length === 0) {
    return { totalCentavos, categorias: [] }; // evita HMGET sem fields
  }

  const ids: string[] = [];
  const valores: number[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    ids.push(rows[i]);
    valores.push(Number(rows[i + 1]));
  }

  // ioredis: hmget(key, ...fields)  |  node-redis v4: hmGet(key, fieldsArray)
  let rawMeta: (string | null)[] = [];
  if (typeof (this.redis as any).hmget === 'function') {
    rawMeta = await (this.redis as any).hmget(dictKey, ...ids);
  } else if (typeof (this.redis as any).hmGet === 'function') {
    rawMeta = await (this.redis as any).hmGet(dictKey, ids);
  }

  const parseCat = (s: string | null) => {
    if (!s) return { nome: null as string | null };
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === 'object') return { nome: obj.nome ?? null };
    } catch { /* formato antigo (string simples) */ }
    return { nome: s };
  };

  const categorias = ids.map((id, i) => {
    const meta = parseCat(rawMeta?.[i] ?? null);
    const v = valores[i];
    return {
      catId: /^\d+$/.test(id) ? Number(id) : id, // mantém número se for numérico
      nome: meta.nome,
      valorCentavos: v,
      percentual: totalCentavos ? v / totalCentavos : 0,
    };
  });

  return { totalCentavos, categorias };
}

  async getCategoriasAno(parceiroId: number, yyyy: string) {
    const k = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:cat`;
    const tot =
      Number(
        await this.redis.get(
          `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:cat:total`,
        ),
      ) || 0;
    const rows = await this.redis.zrevrange(k, 0, -1, 'WITHSCORES'); // [catId, score, ...]
    const ids = [],
      vals = [];
    for (let i = 0; i < rows.length; i += 2) {
      ids.push(rows[i]);
      vals.push(Number(rows[i + 1]));
    }
    const dict = await this.redis.hmget('app:dospy:dict:cat', ...ids);
    return ids.map((id, i) => {
      const meta = dict[i] ? JSON.parse(dict[i]!) : null;
      return {
        catId: Number(id),
        nome: meta?.nome ?? null,
        valorCentavos: vals[i],
        percentual: tot ? vals[i] / tot : 0,
      };
    });
  }

  async getClassesAno(parceiroId: number, yyyy: string) {
    const kByClass = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:class`;          // ZSET
    const kTot     = `app:dospy:{${parceiroId}}:exp:sum:year:${yyyy}:by:class:total`;    // STRING
    const dictKey  = `app:dospy:dict:class`;                                            // HASH (value = JSON { nome, catId } ou string antiga)
  
    const totalCentavos = Number((await this.redis.get(kTot)) ?? 0) || 0;
  
    const rows: string[] = await this.redis.zrevrange(kByClass, 0, -1, 'WITHSCORES');   // [classId, score, ...]
    if (!rows || rows.length === 0) {
      return { totalCentavos, classificacoes: [] };
    }
  
    const ids: string[] = [];
    const valores: number[] = [];
    for (let i = 0; i < rows.length; i += 2) {
      ids.push(rows[i]);
      valores.push(Number(rows[i + 1]));
    }
  
    // ioredis: hmget(key, ...fields)   | node-redis v4: hmGet(key, fieldsArray)
    let rawMeta: (string | null)[] = [];
    if (ids.length > 0) {
      if (typeof (this.redis as any).hmget === 'function') {
        rawMeta = await (this.redis as any).hmget(dictKey, ...ids);
      } else if (typeof (this.redis as any).hmGet === 'function') {
        rawMeta = await (this.redis as any).hmGet(dictKey, ids);
      }
    }
  
    const parseMeta = (s: string | null) => {
      if (!s) return { nome: null as string | null, catId: null as string | null };
      // Se o dicionário já estiver em JSON (novo formato)
      try {
        const obj = JSON.parse(s);
        if (obj && typeof obj === 'object') {
          return {
            nome: obj.nome ?? null,
            catId: obj.catId ?? null,
          };
        }
      } catch {
        // ignorar — era string pura (formato antigo)
      }
      // Formato antigo: apenas o nome como string
      return { nome: s, catId: null };
    };
  
    const classificacoes = ids.map((id, i) => {
      const meta = parseMeta(rawMeta?.[i] ?? null);
      const v = valores[i];
      return {
        classificacaoId: Number(id),
        nome: meta.nome,
        catId: meta.catId,
        valorCentavos: v,
        percentual: totalCentavos ? v / totalCentavos : 0,
      };
    });
  
    return { totalCentavos, classificacoes };
  }
  
}
