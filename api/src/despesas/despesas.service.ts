import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDespesaDto, TipoPagamento } from './dto/create-despesa.dto';

import { Despesa } from './entities/despesa.entity';
import { DespesaCacheService } from '../cash/despesas/despesa-cache/despesa-cache.service';
import { RollupDespesasCacheService } from '../cash/despesas/despesa-cache/rollup-despesas-cache.service';
import { DespesaClassificacaoCacheService } from '../cash/despesas/despesa-classificacao-cache/despesa-classiificacao-cache.service';
import { LancamentoDreService } from '../lancamento-dre/lancamento-dre.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Resultado da criação de despesa dentro de transação
 * Inclui a despesa criada e um callback para processamento pós-commit
 */
export interface CreateWithinTransactionResult {
  despesa: Despesa;
  /**
   * Callback para processar lançamento DRE após o commit da transação.
   * IMPORTANTE: Deve ser chamado pelo serviço que invocou createWithinTransaction
   * APÓS o commit da transação, caso contrário o lançamento DRE não será criado.
   */
  postCommitCallback: () => Promise<void>;
}

@Injectable()
export class DespesasService {
  constructor(
    private prisma: PrismaService,
    private despesaCacheService: DespesaCacheService,
    private rollupDespesasCacheService: RollupDespesasCacheService,
    private DespesaClassificacaoCacheService: DespesaClassificacaoCacheService,
    private lancamentoDreService: LancamentoDreService,
  ) {}

  async create(
    createDespesaDto: CreateDespesaDto,
    parceiroId: number,
  ): Promise<Despesa> {
    // Verificar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: parceiroId },
    });

    if (!parceiro) {
      throw new BadRequestException('Parceiro não encontrado');
    }

    // Verificar se a subcategoria existe (se fornecida)
    let subCategoria = null;
    if (createDespesaDto.subCategoriaId) {
      subCategoria = await this.prisma.subCategoriaDespesa.findUnique({
        where: { idSubCategoria: createDespesaDto.subCategoriaId },
      });

      if (!subCategoria) {
        throw new BadRequestException('Subcategoria não encontrada');
      }
    }

    // Verificar se o fornecedor existe (se fornecido)
    if (createDespesaDto.fornecedorId) {
      const fornecedor = await this.prisma.fornecedor.findUnique({
        where: { id: createDespesaDto.fornecedorId },
      });

      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    // Verificar se a conta DRE existe, pertence ao parceiro e está ativa (se fornecida)
    if (createDespesaDto.contaDreId) {
      const contaDre = await this.prisma.contaDRE.findFirst({
        where: {
          id: createDespesaDto.contaDreId,
          parceiroId: parceiroId,
          ativo: true,
        },
      });

      if (!contaDre) {
        throw new BadRequestException(
          'Conta DRE não encontrada, não pertence ao parceiro ou está inativa',
        );
      }
    }

    // Validações específicas por tipo de pagamento
    if (createDespesaDto.tipoPagamento === TipoPagamento.PARCELADO) {
      if (
        !createDespesaDto.numeroParcelas ||
        createDespesaDto.numeroParcelas < 2
      ) {
        throw new BadRequestException(
          'Número de parcelas deve ser maior que 1 para pagamento parcelado',
        );
      }
      if (!createDespesaDto.dataPrimeiraParcela) {
        throw new BadRequestException(
          'Data da primeira parcela é obrigatória para pagamento parcelado',
        );
      }
      if (
        createDespesaDto.valorEntrada &&
        createDespesaDto.valorEntrada >= createDespesaDto.valorTotal
      ) {
        throw new BadRequestException(
          'Valor de entrada deve ser menor que o valor total',
        );
      }
    }

    const result = await this.prisma.$transaction(async prisma => {
      // Criar instância da entidade com valores padrão
      const despesaEntity = Despesa.create({
        valorTotal: createDespesaDto.valorTotal,
        descricao: createDespesaDto.descricao,
        subCategoriaId: createDespesaDto.subCategoriaId,
        parceiroId: parceiroId,
        fornecedorId: createDespesaDto.fornecedorId,
        currencyId: createDespesaDto.currencyId
          ? createDespesaDto.currencyId
          : parceiro.currencyId,
        cotacao: createDespesaDto.cotacao,
      });

      // Criar a despesa
      const despesa = await prisma.despesa.create({
        data: {
          publicId: despesaEntity.publicId,
          dataRegistro: createDespesaDto.dataRegistro
            ? new Date(createDespesaDto.dataRegistro)
            : new Date(),
          valorTotal: createDespesaDto.valorTotal,
          descricao: createDespesaDto.descricao,
          tipoPagamento: createDespesaDto.tipoPagamento,
          subCategoriaId: createDespesaDto.subCategoriaId,
          parceiroId: parceiroId,
          fornecedorId: createDespesaDto.fornecedorId,
          currencyId: createDespesaDto.currencyId
            ? createDespesaDto.currencyId
            : parceiro.currencyId,
          cotacao: createDespesaDto.cotacao,
          contaDreId: createDespesaDto.contaDreId,
        },
        include: {
          parceiro: true,
          fornecedor: true,
          subCategoria: {
            include: {
              categoria: true,
            },
          },
          contaDre: {
            include: {
              grupo: true,
            },
          },
        },
      });

      // Criar ContasPagar
      const contasPagar = await prisma.contasPagar.create({
        data: {
          publicId: `cp_${despesaEntity.publicId}`,
          despesaId: despesa.id,
          dataCriacao: createDespesaDto.dataRegistro,
          valorTotal: createDespesaDto.valorTotal,
          saldo: 0,
          pago: false,
        },
      });

      // Criar ContasPagarParcelas baseado no tipo de pagamento
      await this.createContasPagarParcelas(
        prisma,
        contasPagar.id,
        createDespesaDto,
      );

      // Atualizar cache de despesas
      await this.updateCacheForNewDespesa(despesa, createDespesaDto);

      // Atualizar cache de despesas classificacao usando ContaDRE (tabela rollup_despesas_mensais_dre)
      if (despesa.contaDreId && despesa.contaDre) {
        await this.DespesaClassificacaoCacheService.updateDespesaClassificacaoCacheDRE(
          despesa.parceiroId,
          despesa.dataRegistro,
          despesa.contaDre.grupoId, // GrupoDRE como "categoria"
          despesa.contaDreId, // ContaDRE como "classificação"
          new Decimal(despesa.valorTotal),
          despesa.contaDre.nome, // Nome da ContaDRE
          despesa.contaDre.grupo?.nome || '', // Nome do GrupoDRE
        );
      } else if (despesa.subCategoria) {
        // Fallback para o cache antigo se não tiver contaDreId
        await this.DespesaClassificacaoCacheService.updateDespesaClassificacaoCache(
          despesa.parceiroId,
          despesa.dataRegistro,
          despesa.subCategoria.categoriaId,
          despesa.subCategoriaId,
          new Decimal(despesa.valorTotal),
          despesa.subCategoria.descricao,
          despesa.subCategoria.categoria.descricao,
        );
      }

      // incremente o contador de despesas no ano.
      await this.rollupDespesasCacheService.incrYear(
        parceiroId,
        despesa.dataRegistro.getFullYear().toString(),
      );

      return {
        ...despesa,
        valorTotal: Number(despesa.valorTotal),
        cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
      } as Despesa;
    });

    // Criar lançamento DRE para a despesa (se tiver contaDreId)
    // Deve ser feito fora da transação para que a despesa já exista no banco
    // Erros no processamento DRE não devem impedir a criação da despesa,
    // pois ela já foi persistida. Log do erro para investigação posterior.
    if (result.contaDreId) {
      try {
        await this.lancamentoDreService.processarDespesa(parceiroId, result.id);
      } catch (error) {
        console.error(
          `Erro ao processar lançamento DRE para despesa ${result.id}:`,
          error,
        );
      }
    }

    return result;
  }

  private async createContasPagarParcelas(
    prisma: any,
    contasPagarId: number,
    createDespesaDto: CreateDespesaDto,
  ) {
    const now = new Date();

    switch (createDespesaDto.tipoPagamento) {
      case TipoPagamento.A_VISTA_IMEDIATA:
        // À vista imediata: 1 parcela já paga
        await prisma.contasPagarParcelas.create({
          data: {
            publicId: `cpp_${Date.now()}_1`,
            contasPagarId,
            currencyId: createDespesaDto.currencyId,
            valor: createDespesaDto.valorTotal,
            dataVencimento: createDespesaDto.dataRegistro,
            dataPagamento: createDespesaDto.dataRegistro,
            pago: true,
          },
        });

        // Atualizar saldo e status do ContasPagar
        await prisma.contasPagar.update({
          where: { id: contasPagarId },
          data: {
            saldo: createDespesaDto.valorTotal,
            dataPagamento: now,
            pago: true,
          },
        });
        break;

      case TipoPagamento.A_PRAZO_SEM_PARCELAS: {
        // À prazo sem parcelas: 1 parcela para a data de vencimento
        const dataVencimento = createDespesaDto.dataVencimento
          ? new Date(createDespesaDto.dataVencimento)
          : now;
        await prisma.contasPagarParcelas.create({
          data: {
            publicId: `cpp_${Date.now()}_1`,
            contasPagarId,
            valor: createDespesaDto.valorTotal,
            dataVencimento,
            dataPagamento: null, // Não foi pago ainda
            pago: false,
            currencyId: createDespesaDto.currencyId,
          },
        });
        break;
      }

      case TipoPagamento.PARCELADO: {
        const valorEntrada = createDespesaDto.valorEntrada || 0;
        const valorRestante = createDespesaDto.valorTotal - valorEntrada;
        const numeroParcelas = createDespesaDto.numeroParcelas || 1;
        const valorParcela = valorRestante / numeroParcelas;
        const dataPrimeiraParcela = new Date(
          createDespesaDto.dataPrimeiraParcela!,
        );

        let saldoPago = 0;

        // Se tem entrada, criar parcela de entrada paga imediatamente
        if (valorEntrada > 0) {
          await prisma.contasPagarParcelas.create({
            data: {
              publicId: `cpp_${Date.now()}_0`,
              contasPagarId,
              valor: valorEntrada,
              dataVencimento: now,
              dataPagamento: now,
              currencyId: createDespesaDto.currencyId,
              pago: true,
            },
          });
          saldoPago = valorEntrada;
        }

        // Criar parcelas restantes
        for (let i = 1; i <= numeroParcelas; i++) {
          const dataVencimentoParcela = new Date(dataPrimeiraParcela);
          dataVencimentoParcela.setMonth(
            dataVencimentoParcela.getMonth() + (i - 1),
          );

          await prisma.contasPagarParcelas.create({
            data: {
              publicId: `cpp_${Date.now()}_${i}`,
              contasPagarId,
              currencyId: createDespesaDto.currencyId,
              valor: valorParcela,
              dataVencimento: dataVencimentoParcela,
              dataPagamento: null, // Parcelas não pagas devem ter dataPagamento null
              pago: false,
            },
          });
        }

        // Atualizar saldo do ContasPagar se houve entrada
        if (saldoPago > 0) {
          await prisma.contasPagar.update({
            where: { id: contasPagarId },
            data: {
              saldo: saldoPago,
              pago: saldoPago >= createDespesaDto.valorTotal,
            },
          });
        }
        break;
      }

      default:
        throw new BadRequestException('Tipo de pagamento inválido');
    }
  }

  /**
   * Cria uma despesa dentro de uma transação externa
   * Usado para integração com outros serviços que precisam manter transação
   *
   * IMPORTANTE: O chamador DEVE executar o postCommitCallback APÓS o commit
   * da transação para garantir que o lançamento DRE e atualizações de cache
   * sejam executados corretamente. Se a transação for revertida, NÃO execute
   * o callback - isso evita inconsistências nos agregados de cache.
   *
   * @example
   * ```typescript
   * const postCommitCallbacks: (() => Promise<void>)[] = [];
   *
   * await this.prisma.$transaction(async (tx) => {
   *   const { despesa, postCommitCallback } = await this.despesasService.createWithinTransaction(dto, parceiroId, tx);
   *   postCommitCallbacks.push(postCommitCallback);
   *   // ... outras operações
   * });
   *
   * // Executar callbacks SOMENTE após commit bem-sucedido
   * await Promise.all(postCommitCallbacks.map(cb => cb()));
   * ```
   */
  async createWithinTransaction(
    createDespesaDto: CreateDespesaDto,
    parceiroId: number,
    tx: any,
  ): Promise<CreateWithinTransactionResult> {
    // Verificar se o parceiro existe
    const parceiro = await tx.parceiro.findUnique({
      where: { id: parceiroId },
    });

    if (!parceiro) {
      throw new BadRequestException('Parceiro não encontrado');
    }

    // Verificar se a subcategoria existe (se fornecida)
    if (createDespesaDto.subCategoriaId) {
      const subCategoria = await tx.subCategoriaDespesa.findUnique({
        where: { idSubCategoria: createDespesaDto.subCategoriaId },
      });

      if (!subCategoria) {
        throw new BadRequestException('Subcategoria não encontrada');
      }
    }

    // Verificar se o fornecedor existe (se fornecido)
    if (createDespesaDto.fornecedorId) {
      const fornecedor = await tx.fornecedor.findUnique({
        where: { id: createDespesaDto.fornecedorId },
      });

      if (!fornecedor) {
        throw new BadRequestException('Fornecedor não encontrado');
      }
    }

    // Verificar se a conta DRE existe, pertence ao parceiro e está ativa (se fornecida)
    if (createDespesaDto.contaDreId) {
      const contaDre = await tx.contaDRE.findFirst({
        where: {
          id: createDespesaDto.contaDreId,
          parceiroId: parceiroId,
          ativo: true,
        },
      });

      if (!contaDre) {
        throw new BadRequestException(
          'Conta DRE não encontrada, não pertence ao parceiro ou está inativa',
        );
      }
    }

    // Validações específicas por tipo de pagamento
    if (createDespesaDto.tipoPagamento === TipoPagamento.PARCELADO) {
      if (
        !createDespesaDto.numeroParcelas ||
        createDespesaDto.numeroParcelas < 2
      ) {
        throw new BadRequestException(
          'Número de parcelas deve ser maior que 1 para pagamento parcelado',
        );
      }
      if (!createDespesaDto.dataPrimeiraParcela) {
        throw new BadRequestException(
          'Data da primeira parcela é obrigatória para pagamento parcelado',
        );
      }
      if (
        createDespesaDto.valorEntrada &&
        createDespesaDto.valorEntrada >= createDespesaDto.valorTotal
      ) {
        throw new BadRequestException(
          'Valor de entrada deve ser menor que o valor total',
        );
      }
    }

    // Criar instância da entidade com valores padrão
    const despesaEntity = Despesa.create({
      valorTotal: createDespesaDto.valorTotal,
      descricao: createDespesaDto.descricao,
      subCategoriaId: createDespesaDto.subCategoriaId,
      parceiroId: parceiroId,
      fornecedorId: createDespesaDto.fornecedorId,
      currencyId: createDespesaDto.currencyId,
      cotacao: createDespesaDto.cotacao,
    });

    // Criar a despesa
    const despesa = await tx.despesa.create({
      data: {
        publicId: despesaEntity.publicId,
        dataRegistro: createDespesaDto.dataRegistro
          ? new Date(createDespesaDto.dataRegistro)
          : new Date(),
        valorTotal: createDespesaDto.valorTotal,
        descricao: createDespesaDto.descricao,
        tipoPagamento: createDespesaDto.tipoPagamento,
        subCategoriaId: createDespesaDto.subCategoriaId,
        parceiroId: parceiroId,
        fornecedorId: createDespesaDto.fornecedorId,
        currencyId: createDespesaDto.currencyId,
        cotacao: createDespesaDto.cotacao,
        contaDreId: createDespesaDto.contaDreId,
      },
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: {
          include: {
            categoria: true,
          },
        },
        contaDre: {
          include: {
            grupo: true,
          },
        },
      },
    });

    // Criar ContasPagar
    const contasPagar = await tx.contasPagar.create({
      data: {
        publicId: `cp_${despesaEntity.publicId}`,
        despesaId: despesa.id,
        dataCriacao: createDespesaDto.dataRegistro,
        valorTotal: createDespesaDto.valorTotal,
        saldo: 0,
        pago: false,
      },
    });

    // Criar ContasPagarParcelas baseado no tipo de pagamento
    await this.createContasPagarParcelas(tx, contasPagar.id, createDespesaDto);

    // NOTE: Todas as operações de cache e DRE são adiadas para o postCommitCallback.
    // Isso garante que, se a transação do chamador falhar e for revertida,
    // os agregados de cache (rollup tables, Redis) e lançamentos DRE não serão
    // atualizados com dados de despesas que não existem mais.

    const result = {
      ...despesa,
      valorTotal: Number(despesa.valorTotal),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    } as Despesa;

    // Captura dados necessários para o callback (snapshot no momento da criação)
    const callbackData = {
      despesaId: result.id,
      parceiroId: despesa.parceiroId,
      dataRegistro: despesa.dataRegistro,
      contaDreId: despesa.contaDreId,
      contaDre: despesa.contaDre,
      subCategoria: despesa.subCategoria,
      subCategoriaId: despesa.subCategoriaId,
      valorTotal: despesa.valorTotal,
    };

    // Retorna a despesa e um callback para processar cache e DRE após o commit
    // O chamador DEVE executar o postCommitCallback SOMENTE após commit bem-sucedido
    const postCommitCallback = async (): Promise<void> => {
      try {
        // 1. Atualizar cache de despesas
        await this.updateCacheForNewDespesa(despesa, createDespesaDto);

        // 2. Atualizar cache de classificação DRE
        if (callbackData.contaDreId && callbackData.contaDre) {
          await this.DespesaClassificacaoCacheService.updateDespesaClassificacaoCacheDRE(
            callbackData.parceiroId,
            callbackData.dataRegistro,
            callbackData.contaDre.grupoId,
            callbackData.contaDreId,
            new Decimal(callbackData.valorTotal),
            callbackData.contaDre.nome,
            callbackData.contaDre.grupo?.nome || '',
          );
        } else if (callbackData.subCategoria) {
          await this.DespesaClassificacaoCacheService.updateDespesaClassificacaoCache(
            callbackData.parceiroId,
            callbackData.dataRegistro,
            callbackData.subCategoria.categoriaId,
            callbackData.subCategoriaId,
            new Decimal(callbackData.valorTotal),
            callbackData.subCategoria.descricao,
            callbackData.subCategoria.categoria.descricao,
          );
        }

        // 3. Incrementar contador de despesas no ano
        await this.rollupDespesasCacheService.incrYear(
          callbackData.parceiroId,
          callbackData.dataRegistro.getFullYear().toString(),
        );

        // 4. Processar lançamento DRE (se aplicável)
        if (callbackData.contaDreId) {
          await this.lancamentoDreService.processarDespesa(
            callbackData.parceiroId,
            callbackData.despesaId,
          );
        }
      } catch (error) {
        // Erros no processamento pós-commit são logados mas não impedem o fluxo
        // A despesa já foi persistida com sucesso
        console.error(
          `Erro ao processar cache/DRE pós-commit para despesa ${callbackData.despesaId}:`,
          error,
        );
      }
    };

    return {
      despesa: result,
      postCommitCallback,
    };
  }

  async findAll(): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      include: {
        parceiro: true,
        fornecedor: true,
        subCategoria: true,
        contaDre: true,
      },
      orderBy: { dataRegistro: 'desc' },
    });
    return despesas.map(despesa => ({
      ...despesa,
      valorTotal: Number(despesa.valorTotal),
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
    })) as Despesa[];
  }

  async findOne(publicId: string, parceiroId: number): Promise<Despesa> {
    const despesa = await this.prisma.despesa.findFirst({
      where: {
        publicId,
        parceiroId,
      },
      include: {
        parceiro: true,
        fornecedor: true,
        currency: true,
        contaDre: true,
        subCategoria: {
          include: {
            categoria: true,
          },
        },
        ContasPagar: {
          include: {
            ContasPagarParcelas: true,
          },
        },
      },
    });

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    // Calcular status de pagamento baseado nas parcelas
    let statusPagamento = 'em_aberto';
    let valorPago = 0;
    let valorTotal = Number(despesa.valorTotal);

    if (despesa.ContasPagar && despesa.ContasPagar.length > 0) {
      const contasPagar = despesa.ContasPagar[0]; // Assumindo uma conta por despesa
      if (
        contasPagar.ContasPagarParcelas &&
        contasPagar.ContasPagarParcelas.length > 0
      ) {
        valorPago = contasPagar.ContasPagarParcelas.filter(
          parcela => parcela.pago,
        ).reduce((sum, parcela) => sum + Number(parcela.valor), 0);

        const totalParcelas = contasPagar.ContasPagarParcelas.length;
        const parcelasPagas = contasPagar.ContasPagarParcelas.filter(
          p => p.pago,
        ).length;

        // Verificar se o valor pago é igual ou maior que o valor total (para lidar com arredondamentos)
        if (parcelasPagas === totalParcelas || valorPago >= valorTotal) {
          statusPagamento = 'paga';
        } else if (parcelasPagas > 0 || valorPago > 0) {
          statusPagamento = 'parcialmente_paga';
        }
      }
    }

    return {
      ...despesa,
      valorTotal,
      cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
      statusPagamento,
      valorPago,
      categoria: despesa.subCategoria?.categoria,
    } as any;
  }

  async findByParceiro(parceiroId: number): Promise<Despesa[]> {
    const despesas = await this.prisma.despesa.findMany({
      where: { parceiroId },
      include: {
        parceiro: true,
        fornecedor: true,
        currency: true,
        subCategoria: {
          include: {
            categoria: true,
          },
        },
        ContasPagar: {
          include: {
            ContasPagarParcelas: true,
          },
        },
      },
      orderBy: { dataRegistro: 'desc' }, // Ordenação decrescente conforme solicitado
    });

    return despesas.map(despesa => {
      // Calcular status de pagamento baseado nas parcelas
      let statusPagamento = 'em_aberto';
      let valorPago = 0;
      let valorTotal = Number(despesa.valorTotal);

      if (despesa.ContasPagar && despesa.ContasPagar.length > 0) {
        const contasPagar = despesa.ContasPagar[0]; // Assumindo uma conta por despesa
        if (
          contasPagar.ContasPagarParcelas &&
          contasPagar.ContasPagarParcelas.length > 0
        ) {
          valorPago = contasPagar.ContasPagarParcelas.filter(
            parcela => parcela.pago,
          ).reduce((sum, parcela) => sum + Number(parcela.valor), 0);

          const totalParcelas = contasPagar.ContasPagarParcelas.length;
          const parcelasPagas = contasPagar.ContasPagarParcelas.filter(
            p => p.pago,
          ).length;

          // Verificar se o valor pago é igual ou maior que o valor total (para lidar com arredondamentos)
          if (parcelasPagas === totalParcelas || valorPago >= valorTotal) {
            statusPagamento = 'paga';
          } else if (parcelasPagas > 0 || valorPago > 0) {
            statusPagamento = 'parcialmente_paga';
          }
        }
      }

      return {
        ...despesa,
        valorTotal,
        cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
        statusPagamento,
        valorPago,
        categoria: despesa.subCategoria?.categoria,
      };
    }) as any[];
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    fornecedorId?: number;
    subCategoriaId?: number;
    grupoDreId?: number;
    year?: string;
    month?: number;
  }) {
    const {
      page,
      limit,
      search,
      parceiroId,
      fornecedorId,
      subCategoriaId,
      grupoDreId,
      year,
      month,
    } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro
    andConditions.push({ parceiroId });

    // Filtro de busca (descrição)
    if (search) {
      andConditions.push({
        descricao: { contains: search, mode: 'insensitive' },
      });
    }

    // Filtro por fornecedor
    if (fornecedorId) {
      andConditions.push({ fornecedorId });
    }

    // Filtro por subcategoria
    if (subCategoriaId) {
      andConditions.push({ subCategoriaId });
    }

    // Filtro por grupo DRE (via contaDre)
    if (grupoDreId) {
      andConditions.push({
        contaDre: {
          is: {
            grupoId: grupoDreId,
          },
        },
      });
    }

    // Filtro por ano e/ou mês
    if (year && year !== 'all') {
      const yearNum = parseInt(year, 10);
      if (month) {
        // Filtrar por ano e mês específicos
        const startDate = new Date(yearNum, month - 1, 1);
        const endDate = new Date(yearNum, month, 0, 23, 59, 59, 999);
        andConditions.push({
          dataRegistro: {
            gte: startDate,
            lte: endDate,
          },
        });
      } else {
        // Filtrar apenas por ano
        const startDate = new Date(yearNum, 0, 1);
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        andConditions.push({
          dataRegistro: {
            gte: startDate,
            lte: endDate,
          },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [despesas, total] = await Promise.all([
      this.prisma.despesa.findMany({
        where,
        include: {
          parceiro: true,
          fornecedor: true,
          currency: true,
          contaDre: {
            include: {
              grupo: true,
            },
          },
          subCategoria: {
            include: {
              categoria: true,
            },
          },
          ContasPagar: {
            include: {
              ContasPagarParcelas: true,
            },
          },
        },
        orderBy: { dataRegistro: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.despesa.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: despesas.map(despesa => {
        // Calcular status de pagamento baseado nas parcelas
        let statusPagamento = 'em_aberto';
        let valorPago = 0;
        let valorTotal = Number(despesa.valorTotal);

        if (despesa.ContasPagar && despesa.ContasPagar.length > 0) {
          const contasPagar = despesa.ContasPagar[0]; // Assumindo uma conta por despesa
          if (
            contasPagar.ContasPagarParcelas &&
            contasPagar.ContasPagarParcelas.length > 0
          ) {
            valorPago = contasPagar.ContasPagarParcelas.filter(
              parcela => parcela.pago,
            ).reduce((sum, parcela) => sum + Number(parcela.valor), 0);

            const totalParcelas = contasPagar.ContasPagarParcelas.length;
            const parcelasPagas = contasPagar.ContasPagarParcelas.filter(
              p => p.pago,
            ).length;

            // Verificar se o valor pago é igual ou maior que o valor total (para lidar com arredondamentos)
            if (parcelasPagas === totalParcelas || valorPago >= valorTotal) {
              statusPagamento = 'paga';
            } else if (parcelasPagas > 0 || valorPago > 0) {
              statusPagamento = 'parcialmente_paga';
            }
          }
        }

        return {
          ...despesa,
          valorTotal,
          cotacao: despesa.cotacao ? Number(despesa.cotacao) : null,
          statusPagamento,
          valorPago,
          categoria: despesa.subCategoria?.categoria,
        };
      }) as any[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    // Verificar se a despesa existe e pertence ao parceiro
    const existingDespesa = await this.prisma.despesa.findFirst({
      where: {
        publicId,
        parceiroId,
      },
      include: {
        parceiro: true,
        subCategoria: {
          include: {
            categoria: true,
          },
        },
        contaDre: {
          include: {
            grupo: true,
          },
        },
        ContasPagar: {
          include: {
            ContasPagarParcelas: true,
          },
        },
      },
    });

    if (!existingDespesa) {
      throw new NotFoundException('Despesa não encontrada');
    }

    // Remover lançamentos DRE associados (deve ser feito ANTES de deletar a despesa)
    if (existingDespesa.contaDreId) {
      await this.lancamentoDreService.removerLancamentoDespesa(
        parceiroId,
        existingDespesa.id,
      );
    }

    // Remover do cache de classificação DRE se tiver contaDreId
    if (existingDespesa.contaDreId && existingDespesa.contaDre) {
      await this.DespesaClassificacaoCacheService.removeDespesaClassificacaoCacheDRE(
        existingDespesa.parceiroId,
        existingDespesa.dataRegistro,
        existingDespesa.contaDre.grupoId,
        existingDespesa.contaDreId,
        existingDespesa.valorTotal,
      );
    } else if (existingDespesa.subCategoria) {
      // Remover do cache de classificação antigo apenas se tiver subcategoria e não tiver contaDreId
      await this.DespesaClassificacaoCacheService.removeDespesaClassificacaoCache(
        existingDespesa.parceiroId,
        existingDespesa.dataRegistro,
        existingDespesa.subCategoria.categoria.idCategoria,
        existingDespesa.subCategoriaId,
        existingDespesa.valorTotal,
      );
    }

    // Remover do cache antes de deletar
    await this.removeCacheForDeletedDespesa(existingDespesa);
    await this.rollupDespesasCacheService.decrYear(
      parceiroId,
      new Date(existingDespesa.dataRegistro).getFullYear().toString(),
    );

    // O delete cascade do Prisma irá automaticamente remover ContasPagar e ContasPagarParcelas
    await this.prisma.despesa.delete({
      where: { id: existingDespesa.id },
    });
  }

  /**
   * Atualiza o cache de despesas para uma nova despesa criada
   */
  private async updateCacheForNewDespesa(
    despesa: any,
    createDespesaDto: CreateDespesaDto,
  ): Promise<void> {
    const parceiroId = despesa.parceiro.id;
    const tipoPagamento = createDespesaDto.tipoPagamento;

    if (tipoPagamento === TipoPagamento.PARCELADO) {
      // Para pagamentos parcelados, processar cada parcela individualmente
      const valorEntrada = createDespesaDto.valorEntrada || 0;
      const valorRestante = createDespesaDto.valorTotal - valorEntrada;
      const numeroParcelas = createDespesaDto.numeroParcelas || 1;
      const valorParcela = valorRestante / numeroParcelas;
      const dataPrimeiraParcela = new Date(
        createDespesaDto.dataPrimeiraParcela!,
      );

      // Se tem entrada, adicionar ao cache como pago (realized)
      if (valorEntrada > 0) {
        await this.despesaCacheService.updateDespesaCache(
          parceiroId,
          despesa.dataRegistro,
          valorEntrada,
          false, // isFuture = false (já pago)
        );
      }

      // Adicionar cada parcela ao cache como futuro (to_pay)
      for (let i = 1; i <= numeroParcelas; i++) {
        const dataVencimentoParcela = new Date(dataPrimeiraParcela);
        dataVencimentoParcela.setMonth(
          dataVencimentoParcela.getMonth() + (i - 1),
        );

        await this.despesaCacheService.updateDespesaCache(
          parceiroId,
          dataVencimentoParcela,
          valorParcela,
          true, // isFuture = true (a pagar)
        );
      }
    } else {
      // Para outros tipos de pagamento, usar a lógica original
      let dataParaCache: Date;
      if (
        tipoPagamento === TipoPagamento.A_PRAZO_SEM_PARCELAS &&
        createDespesaDto.dataVencimento
      ) {
        dataParaCache = new Date(createDespesaDto.dataVencimento);
      } else {
        dataParaCache = despesa.dataRegistro;
      }

      // Determinar se é futuro baseado no tipo de pagamento
      const isFuture = tipoPagamento === TipoPagamento.A_PRAZO_SEM_PARCELAS;

      await this.despesaCacheService.updateDespesaCache(
        parceiroId,
        dataParaCache,
        createDespesaDto.valorTotal,
        isFuture,
      );
    }
  }

  /**
   * Lista todas os anos que tiveram despesas
   */
  async listYears(parceiroId: number) {
    return await this.rollupDespesasCacheService.listYears(parceiroId);
  }

  /**
   * Lista todos os meses que tiveram despesas, agrupados por ano
   */
  async listMonthsWithExpenses(parceiroId: number) {
    const result = await this.prisma.despesa.groupBy({
      by: ['dataRegistro'],
      where: {
        parceiroId,
      },
      _sum: {
        valorTotal: true,
      },
    });

    // Agrupar por ano-mês
    const monthMap = new Map<string, { ano: string; mes: number; total: number }>();

    for (const item of result) {
      const date = new Date(item.dataRegistro);
      const ano = date.getFullYear().toString();
      const mes = date.getMonth() + 1;
      const key = `${ano}-${mes}`;

      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.total += Number(item._sum.valorTotal || 0);
      } else {
        monthMap.set(key, {
          ano,
          mes,
          total: Number(item._sum.valorTotal || 0),
        });
      }
    }

    // Converter para array e ordenar por ano desc, mês desc
    return Array.from(monthMap.values()).sort((a, b) => {
      if (a.ano !== b.ano) {
        return parseInt(b.ano) - parseInt(a.ano);
      }
      return b.mes - a.mes;
    });
  }

  /**
   * Busca despesas para relatório com filtros
   */
  async getExpensesForReport(
    parceiroId: number,
    year?: string,
    month?: number,
  ) {
    const where: any = {
      parceiroId: parceiroId,
    };

    // Filtrar por ano e/ou mês
    if (year && year !== 'all') {
      if (month) {
        // Filtrar por ano e mês específicos
        const startDate = new Date(parseInt(year), month - 1, 1);
        const endDate = new Date(parseInt(year), month, 0, 23, 59, 59, 999);
        where.dataRegistro = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        // Filtrar apenas por ano
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
        where.dataRegistro = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const despesas = await this.prisma.despesa.findMany({
      where,
      include: {
        subCategoria: {
          include: {
            categoria: true,
          },
        },
        fornecedor: true,
        currency: true,
        parceiro: true,
        ContasPagar: {
          include: {
            ContasPagarParcelas: {
              orderBy: {
                dataVencimento: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        dataRegistro: 'asc',
      },
    });

    return despesas;
  }

  /**
   * Remove do cache uma despesa que está sendo deletada
   */
  private async removeCacheForDeletedDespesa(despesa: any): Promise<void> {
    const parceiroId = despesa.parceiro.id;
    // Para cada conta a pagar da despesa
    for (const contasPagar of despesa.ContasPagar) {
      // Para cada parcela da conta a pagar
      console.log('contasPagar:', contasPagar);
      for (const parcela of contasPagar.ContasPagarParcelas) {
        console.log('parcela:', parcela);
        const valorParcela = Number(parcela.valor);
        const dataVencimento = parcela.dataVencimento;

        // Se a parcela está paga, remover do realized
        // Se não está paga, remover do to_pay
        console.log('parcela.pago', parcela);
        await this.despesaCacheService.removeDespesaFromCache(
          parceiroId,
          dataVencimento,
          valorParcela,
          parcela.pago,
        );
      }
    }
  }
}
