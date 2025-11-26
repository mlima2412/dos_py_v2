import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { uuidv7 } from 'uuidv7';
import {
  VendaStatus,
  VendaTipo,
  Prisma,
  TipoMovimento,
  TipoVenda,
  ParcelaStatus,
} from '@prisma/client';
import { Venda } from './entities/venda.entity';
import { FinalizeVendaDiretaDto } from './dto/finalize-venda-direta.dto';
import { FinalizeVendaSemPagamentoDto } from './dto/finalize-venda-sem-pagamento.dto';
import { ProcessDevolucaoItemDto } from './dto/process-devolucao-item.dto';
import { FinalizeVendaCondicionalDto } from './dto/finalize-venda-condicional.dto';
import { DespesasService } from '../despesas/despesas.service';
import { TipoPagamento } from '../despesas/dto/create-despesa.dto';
import { VendaRollupService } from '../cash/vendas/venda-rollup.service';

@Injectable()
export class VendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly despesasService: DespesasService,
    private readonly vendaRollupService: VendaRollupService,
  ) {}

  private mapToVendaEntity(data: any): Venda {
    const venda = new Venda({
      id: data.id,
      publicId: data.publicId,
      usuarioId: data.usuarioId,
      parceiroId: data.parceiroId,
      localSaidaId: data.localSaidaId,
      clienteId: data.clienteId,
      tipo: data.tipo,
      status: data.status,
      dataVenda: data.dataVenda,
      dataEntrega: data.dataEntrega,
      valorFrete: data.valorFrete != null ? Number(data.valorFrete) : null,
      desconto: data.desconto != null ? Number(data.desconto) : null,
      valorTotal: data.valorTotal != null ? Number(data.valorTotal) : null,
      ruccnpj: data.ruccnpj,
      nomeFatura: data.nomeFatura,
      numeroFatura: data.numeroFatura,
      observacao: data.observacao,
      valorComissao:
        data.valorComissao != null ? Number(data.valorComissao) : null,
      clienteNome: data.Cliente?.nome,
      usuarioNome: data.Usuario?.nome,
      VendaItem: data.VendaItem
        ? data.VendaItem.map((vi: any) => ({
            id: vi.id,
            vendaId: vi.vendaId,
            skuId: vi.skuId,
            tipo: vi.tipo,
            qtdReservada: vi.qtdReservada,
            qtdAceita: vi.qtdAceita,
            qtdDevolvida: vi.qtdDevolvida,
            desconto: vi.desconto != null ? Number(vi.desconto) : null,
            descontoTipo: vi.descontoTipo ?? null,
            descontoValor: vi.descontoValor != null ? Number(vi.descontoValor) : null,
            precoUnit: Number(vi.precoUnit),
            custoCompra: vi.custoCompra != null ? Number(vi.custoCompra) : null,
            skuPublicId: vi.ProdutoSKU?.publicId,
            skuCor: vi.ProdutoSKU?.cor ?? null,
            skuCodCor: vi.ProdutoSKU?.codCor ?? null,
            skuTamanho: vi.ProdutoSKU?.tamanho ?? null,
            produtoId: vi.ProdutoSKU?.produto?.id,
            produtoPublicId: vi.ProdutoSKU?.produto?.publicId,
            produtoNome: vi.ProdutoSKU?.produto?.nome,
            produtoPrecoVenda:
              vi.ProdutoSKU?.produto?.precoVenda != null
                ? Number(vi.ProdutoSKU.produto.precoVenda)
                : undefined,
          }))
        : undefined,
      Pagamento: data.Pagamento
        ? data.Pagamento.map((pag: any) => ({
            id: pag.id,
            vendaId: pag.vendaId,
            formaPagamentoId: pag.formaPagamentoId,
            tipo: pag.tipo,
            valor: pag.valor != null ? Number(pag.valor) : 0,
            valorDelivery:
              pag.valorDelivery != null ? Number(pag.valorDelivery) : null,
            entrada: pag.entrada,
            formaPagamentoNome: pag.FormaPagamento?.nome,
          }))
        : undefined,
    });
    return venda;
  }

  private toDecimal(
    value: Decimal | number | string | null | undefined,
  ): Decimal {
    if (value instanceof Decimal) {
      return value;
    }
    if (value === null || value === undefined) {
      return new Decimal(0);
    }
    return new Decimal(value);
  }


  private addMonths(baseDate: Date, months: number): Date {
    const result = new Date(baseDate);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  async create(
    createVendaDto: CreateVendaDto,
    usuarioId: number,
    parceiroId: number,
  ): Promise<Venda> {
    // Validações simples de integridade
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createVendaDto.clienteId },
      select: { id: true, parceiroId: true },
    });
    if (!cliente) {
      throw new BadRequestException('Cliente inválido');
    }
    if (cliente.parceiroId !== parceiroId) {
      throw new ForbiddenException(
        'Cliente não pertence ao parceiro informado',
      );
    }

    const localSaida = await this.prisma.localEstoque.findUnique({
      where: { id: createVendaDto.localSaidaId },
      select: { id: true, parceiroId: true },
    });
    if (!localSaida) {
      throw new BadRequestException('Local de saída inválido');
    }
    if (localSaida.parceiroId !== parceiroId) {
      throw new ForbiddenException(
        'Local de saída não pertence ao parceiro informado',
      );
    }

    const created = await this.prisma.venda.create({
      data: {
        publicId: uuidv7(),
        usuarioId,
        parceiroId,
        localSaidaId: createVendaDto.localSaidaId,
        clienteId: createVendaDto.clienteId,
        tipo: createVendaDto.tipo ?? VendaTipo.DIRETA,
        status: VendaStatus.PEDIDO,
        dataEntrega: createVendaDto.dataEntrega
          ? new Date(createVendaDto.dataEntrega)
          : undefined,
        valorFrete:
          createVendaDto.valorFrete != null
            ? new Decimal(createVendaDto.valorFrete)
            : undefined,
        desconto:
          createVendaDto.desconto != null
            ? new Decimal(createVendaDto.desconto)
            : undefined,
        ruccnpj: createVendaDto.ruccnpj,
        numeroFatura: createVendaDto.numeroFatura,
        observacao: createVendaDto.observacao,
        valorComissao:
          createVendaDto.valorComissao != null
            ? new Decimal(createVendaDto.valorComissao)
            : undefined,
      },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
      },
    });
    const venda = this.mapToVendaEntity(created);

    // Vendas sempre começam com status PEDIDO, então não precisamos registrar rollup aqui.
    // O rollup será registrado apenas quando a venda for finalizada (finalizarDireta, finalizarCondicional, etc.)

    return venda;
  }

  async finalizarDireta(
    publicId: string,
    finalizeDto: FinalizeVendaDiretaDto,
    parceiroId: number,
    usuarioId: number,
  ): Promise<Venda> {
    const vendaFinalizada = await this.prisma.$transaction(async tx => {
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      parceiroId: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!venda) {
        throw new NotFoundException('Venda não encontrada');
      }

      if (venda.tipo !== VendaTipo.DIRETA) {
        throw new BadRequestException(
          'Somente vendas diretas podem ser finalizadas por este endpoint',
        );
      }

      if (venda.status !== VendaStatus.PEDIDO) {
        throw new BadRequestException(
          'A venda já foi finalizada ou está em um status que não permite finalização',
        );
      }

      if (!venda.localSaidaId) {
        throw new BadRequestException(
          'Venda não possui local de saída definido',
        );
      }

      if (!venda.VendaItem.length) {
        throw new BadRequestException(
          'Venda sem itens não pode ser finalizada',
        );
      }

      const localSaidaId = venda.localSaidaId;

      // Validar estoque disponível
      for (const item of venda.VendaItem) {
        const estoque = await tx.estoqueSKU.findUnique({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          select: { qtd: true },
        });

        if (!estoque || estoque.qtd < item.qtdReservada) {
          throw new BadRequestException(
            `Estoque insuficiente para o SKU ${item.skuId} no local selecionado`,
          );
        }
      }

      const itensSubtotal = venda.VendaItem.reduce(
        (acc, item) =>
          acc.add(
            this.toDecimal(item.precoUnit).mul(new Decimal(item.qtdReservada)),
          ),
        new Decimal(0),
      );

      const descontoItens = venda.VendaItem.reduce(
        (acc, item) => acc.add(this.toDecimal(item.desconto)),
        new Decimal(0),
      );

      const descontoTotal = this.toDecimal(
        finalizeDto.descontoTotal ?? venda.desconto,
      ).toDecimalPlaces(2);
      const valorFrete = this.toDecimal(
        finalizeDto.valorFrete ?? venda.valorFrete,
      ).toDecimalPlaces(2);
      const valorComissao = this.toDecimal(
        finalizeDto.valorComissao ?? venda.valorComissao,
      ).toDecimalPlaces(2);

      let totalVenda = itensSubtotal.sub(descontoItens).sub(descontoTotal);
      totalVenda = totalVenda.add(valorFrete).toDecimalPlaces(2);

      if (totalVenda.lessThan(0)) {
        throw new BadRequestException('Total da venda não pode ser negativo');
      }

      const totalPagamentos = finalizeDto.pagamentos.reduce(
        (acc, pagamento) => acc.add(new Decimal(pagamento.valor)),
        new Decimal(0),
      );

      const tolerance = new Decimal(0.01);
      if (totalPagamentos.sub(totalVenda).abs().greaterThan(tolerance)) {
        throw new BadRequestException(
          'Soma dos pagamentos deve ser igual ao total da venda',
        );
      }

      const nomeFatura = finalizeDto.nomeFatura ?? venda.nomeFatura ?? null;
      const ruccnpj = finalizeDto.ruccnpj ?? venda.ruccnpj ?? null;
      const numeroFatura =
        finalizeDto.numeroFatura ?? venda.numeroFatura ?? null;

      // Limpar pagamentos/parcelamentos antigos (caso existam rascunhos)
      await tx.parcelamento.deleteMany({
        where: {
          vendaId: venda.id,
        },
      });
      await tx.pagamento.deleteMany({
        where: { vendaId: venda.id },
      });

      // Movimentar estoque e atualizar itens
      for (const item of venda.VendaItem) {
        await tx.movimentoEstoque.create({
          data: {
            skuId: item.skuId,
            tipo: TipoMovimento.SAIDA,
            qtd: item.qtdReservada,
            idUsuario: usuarioId,
            localOrigemId: localSaidaId,
            observacao: `Saída da venda ${venda.id}`,
          },
        });

        await tx.estoqueSKU.update({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          data: {
            qtd: {
              decrement: item.qtdReservada,
            },
          },
        });

        // Buscar o precoCompra do produto
        const produto = await tx.produto.findFirst({
          where: {
            ProdutoSKU: {
              some: {
                id: item.skuId,
              },
            },
          },
          select: {
            precoCompra: true,
          },
        });

        await tx.vendaItem.update({
          where: { id: item.id },
          data: {
            qtdAceita: item.qtdReservada,
            qtdDevolvida: 0,
            custoCompra: produto?.precoCompra ?? new Decimal(0),
          },
        });
      }

      // Criar pagamentos
      for (const pagamento of finalizeDto.pagamentos) {
        const formaPagamento = await tx.formaPagamento.findFirst({
          where: {
            idFormaPag: pagamento.formaPagamentoId,
            parceiroId,
          },
        });

        if (!formaPagamento) {
          throw new BadRequestException(
            'Forma de pagamento inválida para o parceiro',
          );
        }

        await tx.pagamento.create({
          data: {
            vendaId: venda.id,
            formaPagamentoId: pagamento.formaPagamentoId,
            tipo: pagamento.tipo,
            valor: new Decimal(pagamento.valor),
            valorDelivery:
              pagamento.valorDelivery != null
                ? new Decimal(pagamento.valorDelivery)
                : undefined,
            entrada: pagamento.entrada ?? false,
          },
        });
      }

      // Filtrar pagamentos parcelados (não à vista) para criar um único parcelamento
      const pagamentosParcelados = finalizeDto.pagamentos.filter(
        p => p.tipo !== TipoVenda.A_VISTA_IMEDIATA,
      );

      if (pagamentosParcelados.length > 0) {
        // Calcular valor total do parcelamento (soma de todos os pagamentos parcelados)
        const valorTotalParcelamento = pagamentosParcelados.reduce(
          (acc, p) => acc + p.valor,
          0,
        );

        // Criar um único parcelamento para a venda
        const parcelamento = await tx.parcelamento.create({
          data: {
            vendaId: venda.id,
            clienteId: venda.clienteId,
            valorTotal: valorTotalParcelamento,
            valorPago: 0,
            situacao: 1,
          },
        });

        // Criar parcelas baseadas em cada forma de pagamento parcelada
        let numeroParcela = 1;

        for (const pagamento of pagamentosParcelados) {
          if (pagamento.tipo === TipoVenda.A_PRAZO_SEM_PARCELAS) {
            if (!pagamento.vencimento) {
              throw new BadRequestException(
                'Data de vencimento obrigatória para pagamento a prazo',
              );
            }

            await tx.parcelas.create({
              data: {
                parcelamentoId: parcelamento.id,
                numero: numeroParcela++,
                valor: new Decimal(pagamento.valor),
                vencimento: new Date(pagamento.vencimento),
                status: ParcelaStatus.PENDENTE,
              },
            });
            continue;
          }

          if (pagamento.tipo === TipoVenda.PARCELADO) {
            if (!pagamento.numeroParcelas || pagamento.numeroParcelas < 2) {
              throw new BadRequestException(
                'Pagamento parcelado deve ter pelo menos 2 parcelas',
              );
            }

            if (!pagamento.primeiraParcelaData) {
              throw new BadRequestException(
                'Data da primeira parcela é obrigatória para pagamento parcelado',
              );
            }

            const primeiraParcelaDate = new Date(pagamento.primeiraParcelaData);
            const numeroParcelas = pagamento.numeroParcelas;
            const totalParcelado = new Decimal(pagamento.valor);
            const valorParcelaBase = totalParcelado
              .div(numeroParcelas)
              .toDecimalPlaces(2);

            let acumulado = new Decimal(0);

            for (let i = 1; i <= numeroParcelas; i++) {
              let valorParcela = valorParcelaBase;
              if (i === numeroParcelas) {
                valorParcela = totalParcelado.sub(acumulado);
              } else {
                acumulado = acumulado.add(valorParcelaBase);
              }

              const vencimento = this.addMonths(primeiraParcelaDate, i - 1);

              await tx.parcelas.create({
                data: {
                  parcelamentoId: parcelamento.id,
                  numero: numeroParcela++,
                  valor: valorParcela,
                  vencimento,
                  status: ParcelaStatus.PENDENTE,
                },
              });
            }
            continue;
          }

          // TipoVenda.PARCELADO_FLEXIVEL não gera parcelas iniciais
        }
      }

      // Atualizar venda com totais e status
      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: VendaStatus.CONFIRMADA,
          valorFrete,
          desconto: descontoTotal,
          valorComissao,
          valorTotal: totalVenda,
          nomeFatura,
          ruccnpj,
          numeroFatura,
        },
      });

      await tx.cliente.update({
        where: { id: venda.clienteId },
        data: {
          ultimaCompra: new Date(),
          qtdCompras: { increment: 1 },
          // atualiza o ruccnpj do cliente se estiver vazio
          ruccnpj:
            nomeFatura?.length === 0 && ruccnpj?.length > 0 ? ruccnpj : null,
        },
      });

      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      publicId: true,
                      nome: true,
                      precoVenda: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vendaAtualizada) {
        throw new NotFoundException('Erro ao finalizar venda');
      }

      return this.mapToVendaEntity(vendaAtualizada);
    });

    console.log('[VendaService] Calling registerVendaConfirmada after finalizarDireta:', {
      parceiroId,
      dataVenda: vendaFinalizada.dataVenda,
      tipo: vendaFinalizada.tipo,
      valorTotal: vendaFinalizada.valorTotal,
    });

    await this.vendaRollupService.registerVendaConfirmada({
      parceiroId,
      dataVenda: vendaFinalizada.dataVenda,
      tipo: vendaFinalizada.tipo,
      valorTotal: vendaFinalizada.valorTotal ?? 0,
      descontoTotal: vendaFinalizada.desconto ?? 0,
    });

    return vendaFinalizada;
  }
  async finalizarBrindePermuta(
    publicId: string,
    finalizeDto: FinalizeVendaSemPagamentoDto,
    parceiroId: number,
    usuarioId: number,
  ): Promise<Venda> {
    const vendaFinalizada = await this.prisma.$transaction(async tx => {
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      parceiroId: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!venda) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (venda.tipo !== VendaTipo.BRINDE && venda.tipo !== VendaTipo.PERMUTA) {
        throw new BadRequestException(
          'Somente vendas de brinde ou permuta podem ser finalizadas por este endpoint',
        );
      }

      if (venda.status !== VendaStatus.PEDIDO) {
        throw new BadRequestException(
          'O pedido já foi finalizado ou está em um status que não permite finalização',
        );
      }

      if (!venda.localSaidaId) {
        throw new BadRequestException(
          'Venda não possui local de saída definido',
        );
      }

      if (!venda.VendaItem.length) {
        throw new BadRequestException(
          'Venda sem itens não pode ser finalizada',
        );
      }

      const localSaidaId = venda.localSaidaId;

      // Validar estoque disponível
      for (const item of venda.VendaItem) {
        const estoque = await tx.estoqueSKU.findUnique({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          select: { qtd: true },
        });

        if (!estoque || estoque.qtd < item.qtdReservada) {
          throw new BadRequestException(
            `Estoque insuficiente para o SKU ${item.skuId} no local selecionado`,
          );
        }
      }

      const itensSubtotal = venda.VendaItem.reduce(
        (acc, item) =>
          acc.add(
            this.toDecimal(item.precoUnit).mul(new Decimal(item.qtdReservada)),
          ),
        new Decimal(0),
      );

      const descontoItens = venda.VendaItem.reduce(
        (acc, item) => acc.add(this.toDecimal(item.desconto)),
        new Decimal(0),
      );

      const descontoTotal = this.toDecimal(
        finalizeDto.descontoTotal ?? venda.desconto,
      ).toDecimalPlaces(2);
      const valorFrete = this.toDecimal(
        finalizeDto.valorFrete ?? venda.valorFrete,
      ).toDecimalPlaces(2);
      const valorComissao = this.toDecimal(
        finalizeDto.valorComissao ?? venda.valorComissao,
      ).toDecimalPlaces(2);

      let totalVenda = itensSubtotal.sub(descontoItens).sub(descontoTotal);
      totalVenda = totalVenda.add(valorFrete).toDecimalPlaces(2);

      if (totalVenda.lessThan(0)) {
        throw new BadRequestException('Total da venda não pode ser negativo');
      }

      const nomeFatura = finalizeDto.nomeFatura ?? venda.nomeFatura ?? null;
      const ruccnpj = finalizeDto.ruccnpj ?? venda.ruccnpj ?? null;
      const numeroFatura =
        finalizeDto.numeroFatura ?? venda.numeroFatura ?? null;

      // Movimentar estoque e atualizar itens
      for (const item of venda.VendaItem) {
        await tx.movimentoEstoque.create({
          data: {
            skuId: item.skuId,
            tipo: TipoMovimento.SAIDA,
            qtd: item.qtdReservada,
            idUsuario: usuarioId,
            localOrigemId: localSaidaId,
            observacao: `Saída por ${venda.tipo === VendaTipo.BRINDE ? 'brinde' : 'permuta'} ${venda.id}`,
          },
        });

        await tx.estoqueSKU.update({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          data: {
            qtd: {
              decrement: item.qtdReservada,
            },
          },
        });

        // Buscar o precoCompra do produto
        const produto = await tx.produto.findFirst({
          where: {
            ProdutoSKU: {
              some: {
                id: item.skuId,
              },
            },
          },
          select: {
            precoCompra: true,
          },
        });

        await tx.vendaItem.update({
          where: { id: item.id },
          data: {
            qtdAceita: item.qtdReservada,
            qtdDevolvida: 0,
            custoCompra: produto?.precoCompra ?? new Decimal(0),
          },
        });
      }

      // Se for PERMUTA, criar despesa
      if (venda.tipo === VendaTipo.PERMUTA) {
        // Buscar ou criar categoria "Operacional"
        let categoria = await tx.categoriaDespesas.findFirst({
          where: {
            descricao: 'Operacional',
          },
        });

        if (!categoria) {
          categoria = await tx.categoriaDespesas.create({
            data: {
              descricao: 'Operacional',
            },
          });
        }

        // Buscar ou criar subcategoria "Permuta"
        let subCategoria = await tx.subCategoriaDespesa.findFirst({
          where: {
            descricao: 'Permuta',
            categoriaId: categoria.idCategoria,
          },
        });

        if (!subCategoria) {
          subCategoria = await tx.subCategoriaDespesa.create({
            data: {
              descricao: 'Permuta',
              categoriaId: categoria.idCategoria,
            },
          });
        }

        // Buscar parceiro para obter currency padrão
        const parceiro = await tx.parceiro.findUnique({
          where: { id: parceiroId },
          select: { currencyId: true },
        });

        if (!parceiro) {
          throw new BadRequestException('Parceiro não encontrado');
        }

        // Criar despesa usando o service
        await this.despesasService.createWithinTransaction(
          {
            descricao: `Permuta com a venda ${venda.id}`,
            valorTotal: totalVenda.toNumber(),
            dataRegistro: new Date().toISOString(),
            tipoPagamento: TipoPagamento.A_VISTA_IMEDIATA,
            subCategoriaId: subCategoria.idSubCategoria,
            parceiroId: parceiroId,
            fornecedorId: undefined,
            currencyId: parceiro.currencyId,
            cotacao: undefined,
          },
          parceiroId,
          tx,
        );
      }

      // Atualizar venda com totais e status
      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: VendaStatus.CONFIRMADA,
          valorFrete,
          desconto: descontoTotal,
          valorComissao,
          valorTotal: totalVenda,
          nomeFatura,
          ruccnpj,
          numeroFatura,
        },
      });

      await tx.cliente.update({
        where: { id: venda.clienteId },
        data: {
          ultimaCompra: new Date(),
          qtdCompras: { increment: 1 },
          // atualiza o ruccnpj do cliente se estiver vazio
          ruccnpj:
            nomeFatura &&
            nomeFatura.length === 0 &&
            ruccnpj &&
            ruccnpj.length > 0
              ? ruccnpj
              : undefined,
        },
      });

      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      publicId: true,
                      nome: true,
                      precoVenda: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vendaAtualizada) {
        throw new NotFoundException('Erro ao finalizar venda');
      }

      return this.mapToVendaEntity(vendaAtualizada);
    });

    console.log('[VendaService] Calling registerVendaConfirmada after finalizarBrindePermuta:', {
      parceiroId,
      dataVenda: vendaFinalizada.dataVenda,
      tipo: vendaFinalizada.tipo,
      valorTotal: vendaFinalizada.valorTotal,
    });

    await this.vendaRollupService.registerVendaConfirmada({
      parceiroId,
      dataVenda: vendaFinalizada.dataVenda,
      tipo: vendaFinalizada.tipo,
      valorTotal: vendaFinalizada.valorTotal ?? 0,
      descontoTotal: vendaFinalizada.desconto ?? 0,
    });

    return vendaFinalizada;
  }

  async findAll(parceiroId: number): Promise<Venda[]> {
    const vendas = await this.prisma.venda.findMany({
      where: { parceiroId },
      orderBy: { dataVenda: 'desc' },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
        Cliente: { select: { id: true, nome: true } },
        Usuario: { select: { id: true, nome: true } },
        VendaItem: {
          select: {
            id: true,
            vendaId: true,
            skuId: true,
            tipo: true,
            qtdReservada: true,
            qtdAceita: true,
            qtdDevolvida: true,
            desconto: true,
            precoUnit: true,
            custoCompra: true,
            ProdutoSKU: {
              select: {
                id: true,
                publicId: true,
                tamanho: true,
                cor: true,
                codCor: true,
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                    precoVenda: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return vendas.map(v => this.mapToVendaEntity(v));
  }

  async paginate(
    parceiroId: number,
    page: number,
    limit: number,
    status?: VendaStatus,
    filterType?: 'pedido' | 'venda' | 'condicional' | 'brindePermuta',
    tipo?: VendaTipo,
    search?: string,
  ): Promise<{ data: Venda[]; total: number; page: number; limit: number }> {
    const where: Prisma.VendaWhereInput = { parceiroId };

    // Aplicar filtros predefinidos baseados no menu
    if (filterType) {
      switch (filterType) {
        case 'pedido':
          // Pedidos em aberto: status = PEDIDO (qualquer tipo)
          where.status = VendaStatus.PEDIDO;
          break;
        case 'venda':
          // Vendas realizadas: DIRETA/BRINDE/PERMUTA (status CONFIRMADA) + CONDICIONAL (status CONFIRMADA_TOTAL ou CONFIRMADA_PARCIAL)
          where.tipo = { in: [VendaTipo.DIRETA, VendaTipo.CONDICIONAL] };
          where.status = {
            in: [
              VendaStatus.CONFIRMADA,
              VendaStatus.CONFIRMADA_TOTAL,
              VendaStatus.CONFIRMADA_PARCIAL,
            ],
          };
          break;
        case 'condicional':
          // Condicionais: tipo CONDICIONAL com status ABERTA (produtos enviados aguardando retorno)
          where.tipo = VendaTipo.CONDICIONAL;
          where.status = VendaStatus.ABERTA;
          break;
        case 'brindePermuta':
          // Brindes e Permutas: tipo BRINDE ou PERMUTA com status CONFIRMADA
          where.tipo = { in: [VendaTipo.BRINDE, VendaTipo.PERMUTA] };
          where.status = VendaStatus.CONFIRMADA;
          break;
      }
    } else if (status) {
      // Filtro legado por status único
      where.status = status;
    }

    // Filtro adicional por tipo de venda (select no frontend)
    if (tipo && !filterType) {
      where.tipo = tipo;
    } else if (tipo && filterType) {
      // Se filterType já foi aplicado, adicionar tipo como filtro adicional apenas se compatível
      if (filterType === 'venda') {
        // Para vendas realizadas, permitir filtrar entre DIRETA e CONDICIONAL
        if (tipo === VendaTipo.DIRETA || tipo === VendaTipo.CONDICIONAL) {
          where.tipo = tipo;
        }
      } else if (filterType === 'brindePermuta') {
        // Para brindes e permutas, permitir filtrar entre BRINDE e PERMUTA
        if (tipo === VendaTipo.BRINDE || tipo === VendaTipo.PERMUTA) {
          where.tipo = tipo;
        }
      }
    }

    // Filtro por termo de busca (nome do cliente)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.Cliente = {
        OR: [{ nome: { contains: searchTerm, mode: 'insensitive' } }],
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.venda.count({ where }),
      this.prisma.venda.findMany({
        where,
        orderBy: { dataVenda: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          publicId: true,
          usuarioId: true,
          parceiroId: true,
          localSaidaId: true,
          clienteId: true,
          tipo: true,
          status: true,
          dataVenda: true,
          dataEntrega: true,
          valorFrete: true,
          desconto: true,
          valorTotal: true,
          ruccnpj: true,
          numeroFatura: true,
          nomeFatura: true,
          observacao: true,
          valorComissao: true,
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            select: {
              id: true,
              vendaId: true,
              skuId: true,
              tipo: true,
              qtdReservada: true,
              qtdAceita: true,
              qtdDevolvida: true,
              desconto: true,
              descontoTipo: true,
              descontoValor: true,
              precoUnit: true,
              custoCompra: true,
            },
          },
        },
      }),
    ]);

    return {
      data: data.map(d => this.mapToVendaEntity(d)),
      total,
      page,
      limit,
    };
  }

  async findOne(publicId: string, parceiroId: number): Promise<Venda> {
    const venda = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        valorTotal: true,
        ruccnpj: true,
        numeroFatura: true,
        nomeFatura: true,
        observacao: true,
        valorComissao: true,
        Cliente: { select: { id: true, nome: true } },
        VendaItem: {
          select: {
            id: true,
            vendaId: true,
            skuId: true,
            tipo: true,
            qtdReservada: true,
            qtdAceita: true,
            qtdDevolvida: true,
            desconto: true,
            descontoTipo: true,
            descontoValor: true,
            precoUnit: true,
            custoCompra: true,
            ProdutoSKU: {
              select: {
                id: true,
                publicId: true,
                tamanho: true,
                cor: true,
                codCor: true,
                produto: {
                  select: {
                    id: true,
                    publicId: true,
                    nome: true,
                    precoVenda: true,
                  },
                },
              },
            },
          },
        },
        Pagamento: {
          select: {
            id: true,
            vendaId: true,
            formaPagamentoId: true,
            tipo: true,
            valor: true,
            valorDelivery: true,
            entrada: true,
            FormaPagamento: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }
    return this.mapToVendaEntity(venda);
  }

  async update(
    publicId: string,
    updateVendaDto: UpdateVendaDto,
    parceiroId: number,
  ): Promise<Venda> {
    const existing = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
    });
    if (!existing) {
      throw new NotFoundException('Venda não encontrada');
    }

    const updated = await this.prisma.venda.update({
      where: { id: existing.id },
      data: {
        tipo: updateVendaDto.tipo ?? undefined,
        dataEntrega: updateVendaDto.dataEntrega
          ? new Date(updateVendaDto.dataEntrega)
          : undefined,
        valorFrete:
          updateVendaDto.valorFrete != null
            ? new Decimal(updateVendaDto.valorFrete)
            : undefined,
        desconto:
          updateVendaDto.desconto != null
            ? new Decimal(updateVendaDto.desconto)
            : undefined,
        ruccnpj: updateVendaDto.ruccnpj ?? undefined,
        numeroFatura: updateVendaDto.numeroFatura ?? undefined,
        observacao: updateVendaDto.observacao ?? undefined,
        valorComissao:
          updateVendaDto.valorComissao != null
            ? new Decimal(updateVendaDto.valorComissao)
            : undefined,
      },
      select: {
        id: true,
        publicId: true,
        usuarioId: true,
        parceiroId: true,
        localSaidaId: true,
        clienteId: true,
        tipo: true,
        status: true,
        dataVenda: true,
        dataEntrega: true,
        valorFrete: true,
        desconto: true,
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
      },
    });
    return this.mapToVendaEntity(updated);
  }

  async getInvoiceNames(
    parceiroId: number,
    clienteId: number,
  ): Promise<{ nomeFatura: string | null; ruccnpj: string | null }[]> {
    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      throw new BadRequestException('clienteId inválido');
    }

    const results = await this.prisma.venda.findMany({
      where: {
        parceiroId,
        clienteId,
        OR: [{ nomeFatura: { not: null } }, { ruccnpj: { not: null } }],
      },
      select: { nomeFatura: true, ruccnpj: true },
      distinct: ['nomeFatura', 'ruccnpj'] as Prisma.VendaScalarFieldEnum[],
    });

    return results.map(r => ({
      nomeFatura: r.nomeFatura ?? null,
      ruccnpj: r.ruccnpj ?? null,
    }));
  }

  async confirmarCondicional(
    publicId: string,
    parceiroId: number,
    usuarioId: number,
  ): Promise<Venda> {
    return await this.prisma.$transaction(async tx => {
      // 1. Buscar venda
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: { id: true, parceiroId: true, nome: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!venda) {
        throw new NotFoundException('Venda não encontrada');
      }

      // 2. Validações
      if (venda.tipo !== VendaTipo.CONDICIONAL) {
        throw new BadRequestException(
          'Apenas vendas condicionais podem usar este endpoint',
        );
      }

      if (venda.status !== VendaStatus.PEDIDO) {
        throw new BadRequestException('Condicional já foi confirmada anteriormente');
      }

      if (!venda.localSaidaId) {
        throw new BadRequestException('Venda não possui local de saída definido');
      }

      if (!venda.VendaItem.length) {
        throw new BadRequestException('Venda sem itens não pode ser confirmada');
      }

      const localSaidaId = venda.localSaidaId;

      // 3. Validar estoque disponível
      for (const item of venda.VendaItem) {
        const estoque = await tx.estoqueSKU.findUnique({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          select: { qtd: true },
        });

        if (!estoque || estoque.qtd < item.qtdReservada) {
          throw new BadRequestException(
            `Estoque insuficiente para o SKU ${item.skuId} no local selecionado`,
          );
        }
      }

      // 4. Baixar estoque e criar movimentos tipo CONDICIONAL
      for (const item of venda.VendaItem) {
        await tx.movimentoEstoque.create({
          data: {
            skuId: item.skuId,
            tipo: TipoMovimento.CONDICIONAL,
            qtd: item.qtdReservada,
            idUsuario: usuarioId,
            localOrigemId: localSaidaId,
            observacao: `Saída condicional - Venda ${venda.id}`,
          },
        });

        await tx.estoqueSKU.update({
          where: {
            localId_skuId: {
              localId: localSaidaId,
              skuId: item.skuId,
            },
          },
          data: {
            qtd: {
              decrement: item.qtdReservada,
            },
          },
        });
      }

      // 5. Atualizar status da venda para ABERTA
      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: VendaStatus.ABERTA,
        },
      });

      // 6. Buscar venda atualizada
      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      publicId: true,
                      nome: true,
                      precoVenda: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vendaAtualizada) {
        throw new NotFoundException('Erro ao confirmar condicional');
      }

      return this.mapToVendaEntity(vendaAtualizada);
    });
  }

  async processarDevolucao(
    publicId: string,
    devolucaoDto: ProcessDevolucaoItemDto,
    parceiroId: number,
    usuarioId: number,
  ): Promise<Venda> {
    return await this.prisma.$transaction(async tx => {
      // 1. Buscar venda
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          VendaItem: true,
        },
      });

      if (!venda) {
        throw new NotFoundException('Venda não encontrada');
      }

      // 2. Validações
      if (venda.tipo !== VendaTipo.CONDICIONAL) {
        throw new BadRequestException(
          'Apenas vendas condicionais podem ter devoluções',
        );
      }

      if (venda.status !== VendaStatus.ABERTA) {
        throw new BadRequestException(
          'Apenas condicionais com status ABERTA podem processar devoluções',
        );
      }

      if (!venda.localSaidaId) {
        throw new BadRequestException('Venda não possui local de saída definido');
      }

      // 3. Buscar item da venda
      const vendaItem = venda.VendaItem.find(
        item => item.skuId === devolucaoDto.skuId,
      );

      if (!vendaItem) {
        throw new BadRequestException('SKU não pertence a esta venda');
      }

      // 4. Validar quantidade de devolução
      const qtdJaDevolvida = vendaItem.qtdDevolvida;
      const qtdReservada = vendaItem.qtdReservada;
      const novaQtdDevolvida = qtdJaDevolvida + devolucaoDto.qtdDevolvida;

      if (novaQtdDevolvida > qtdReservada) {
        throw new BadRequestException(
          `Quantidade de devolução (${novaQtdDevolvida}) excede quantidade reservada (${qtdReservada})`,
        );
      }

      // 5. Criar movimento de DEVOLUCAO (entrada no estoque)
      await tx.movimentoEstoque.create({
        data: {
          skuId: devolucaoDto.skuId,
          tipo: TipoMovimento.DEVOLUCAO,
          qtd: devolucaoDto.qtdDevolvida,
          idUsuario: usuarioId,
          localDestinoId: venda.localSaidaId,
          observacao: `Devolução condicional - Venda ${venda.id}`,
        },
      });

      // 6. Incrementar estoque
      await tx.estoqueSKU.upsert({
        where: {
          localId_skuId: {
            localId: venda.localSaidaId,
            skuId: devolucaoDto.skuId,
          },
        },
        update: {
          qtd: {
            increment: devolucaoDto.qtdDevolvida,
          },
        },
        create: {
          localId: venda.localSaidaId,
          skuId: devolucaoDto.skuId,
          qtd: devolucaoDto.qtdDevolvida,
        },
      });

      // 7. Atualizar qtdDevolvida no VendaItem
      await tx.vendaItem.update({
        where: { id: vendaItem.id },
        data: {
          qtdDevolvida: novaQtdDevolvida,
        },
      });

      // 8. Buscar venda atualizada
      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      publicId: true,
                      nome: true,
                      precoVenda: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vendaAtualizada) {
        throw new NotFoundException('Erro ao processar devolução');
      }

      return this.mapToVendaEntity(vendaAtualizada);
    });
  }

  async finalizarCondicional(
    publicId: string,
    finalizeDto: FinalizeVendaCondicionalDto,
    parceiroId: number,
  ): Promise<Venda> {
    const vendaFinalizada = await this.prisma.$transaction(async tx => {
      // 1. Buscar venda
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      parceiroId: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!venda) {
        throw new NotFoundException('Venda não encontrada');
      }

      // 2. Validações
      if (venda.tipo !== VendaTipo.CONDICIONAL) {
        throw new BadRequestException(
          'Apenas vendas condicionais podem usar este endpoint',
        );
      }

      if (venda.status !== VendaStatus.ABERTA) {
        throw new BadRequestException(
          'Apenas condicionais com status ABERTA podem ser finalizadas',
        );
      }

      if (!venda.VendaItem.length) {
        throw new BadRequestException('Venda sem itens não pode ser finalizada');
      }

      // 3. Calcular itens aceitos e totais
      let totalItensAceitos = 0;
      const itensSubtotal = venda.VendaItem.reduce((acc, item) => {
        const qtdAceita = item.qtdReservada - item.qtdDevolvida;
        totalItensAceitos += qtdAceita;
        return acc.add(
          this.toDecimal(item.precoUnit).mul(new Decimal(qtdAceita)),
        );
      }, new Decimal(0));

      // Validar se tem pelo menos 1 item aceito
      if (totalItensAceitos === 0) {
        throw new BadRequestException(
          'Não é possível finalizar: todos os itens foram devolvidos. Use o cancelamento.',
        );
      }

      const descontoItens = venda.VendaItem.reduce((acc, item) => {
        const qtdAceita = item.qtdReservada - item.qtdDevolvida;
        if (qtdAceita === 0) return acc; // Não considerar desconto de itens devolvidos

        // Desconto proporcional aos itens aceitos
        const descontoOriginal = this.toDecimal(item.desconto);
        const fatorProporcional = new Decimal(qtdAceita).div(item.qtdReservada);
        const descontoProporcional = descontoOriginal.mul(fatorProporcional);

        return acc.add(descontoProporcional);
      }, new Decimal(0));

      const descontoTotal = this.toDecimal(
        finalizeDto.descontoTotal ?? venda.desconto,
      ).toDecimalPlaces(2);
      const valorFrete = this.toDecimal(
        finalizeDto.valorFrete ?? venda.valorFrete,
      ).toDecimalPlaces(2);
      const valorComissao = this.toDecimal(
        finalizeDto.valorComissao ?? venda.valorComissao,
      ).toDecimalPlaces(2);

      let totalVenda = itensSubtotal.sub(descontoItens).sub(descontoTotal);
      totalVenda = totalVenda.add(valorFrete).toDecimalPlaces(2);

      if (totalVenda.lessThan(0)) {
        throw new BadRequestException('Total da venda não pode ser negativo');
      }

      // 4. Validar pagamentos
      const totalPagamentos = finalizeDto.pagamentos.reduce(
        (acc, pagamento) => acc.add(new Decimal(pagamento.valor)),
        new Decimal(0),
      );

      const tolerance = new Decimal(0.01);
      if (totalPagamentos.sub(totalVenda).abs().greaterThan(tolerance)) {
        throw new BadRequestException(
          'Soma dos pagamentos deve ser igual ao total da venda',
        );
      }

      const nomeFatura = finalizeDto.nomeFatura ?? venda.nomeFatura ?? null;
      const ruccnpj = finalizeDto.ruccnpj ?? venda.ruccnpj ?? null;
      const numeroFatura = finalizeDto.numeroFatura ?? venda.numeroFatura ?? null;

      // 5. Atualizar qtdAceita em cada item e registrar custoCompra
      for (const item of venda.VendaItem) {
        const qtdAceita = item.qtdReservada - item.qtdDevolvida;

        // Buscar o precoCompra do produto
        const produto = await tx.produto.findFirst({
          where: {
            ProdutoSKU: {
              some: {
                id: item.skuId,
              },
            },
          },
          select: {
            precoCompra: true,
          },
        });

        await tx.vendaItem.update({
          where: { id: item.id },
          data: {
            qtdAceita,
            custoCompra: produto?.precoCompra ?? new Decimal(0),
          },
        });
      }

      // 6. Limpar pagamentos/parcelamentos antigos
      await tx.parcelamento.deleteMany({
        where: { vendaId: venda.id },
      });
      await tx.pagamento.deleteMany({
        where: { vendaId: venda.id },
      });

      // 7. Criar pagamentos (mesma lógica de finalizarDireta)
      for (const pagamento of finalizeDto.pagamentos) {
        const formaPagamento = await tx.formaPagamento.findFirst({
          where: {
            idFormaPag: pagamento.formaPagamentoId,
            parceiroId,
          },
        });

        if (!formaPagamento) {
          throw new BadRequestException(
            'Forma de pagamento inválida para o parceiro',
          );
        }

        await tx.pagamento.create({
          data: {
            vendaId: venda.id,
            formaPagamentoId: pagamento.formaPagamentoId,
            tipo: pagamento.tipo,
            valor: new Decimal(pagamento.valor),
            valorDelivery:
              pagamento.valorDelivery != null
                ? new Decimal(pagamento.valorDelivery)
                : undefined,
            entrada: pagamento.entrada ?? false,
          },
        });
      }

      // 8. Processar parcelamentos (mesma lógica de finalizarDireta)
      const pagamentosParcelados = finalizeDto.pagamentos.filter(
        p => p.tipo !== TipoVenda.A_VISTA_IMEDIATA,
      );

      if (pagamentosParcelados.length > 0) {
        const valorTotalParcelamento = pagamentosParcelados.reduce(
          (acc, p) => acc + p.valor,
          0,
        );

        const parcelamento = await tx.parcelamento.create({
          data: {
            vendaId: venda.id,
            clienteId: venda.clienteId,
            valorTotal: valorTotalParcelamento,
            valorPago: 0,
            situacao: 1,
          },
        });

        let numeroParcela = 1;

        for (const pagamento of pagamentosParcelados) {
          if (pagamento.tipo === TipoVenda.A_PRAZO_SEM_PARCELAS) {
            if (!pagamento.vencimento) {
              throw new BadRequestException(
                'Data de vencimento obrigatória para pagamento a prazo',
              );
            }

            await tx.parcelas.create({
              data: {
                parcelamentoId: parcelamento.id,
                numero: numeroParcela++,
                valor: new Decimal(pagamento.valor),
                vencimento: new Date(pagamento.vencimento),
                status: ParcelaStatus.PENDENTE,
              },
            });
            continue;
          }

          if (pagamento.tipo === TipoVenda.PARCELADO) {
            if (!pagamento.numeroParcelas || pagamento.numeroParcelas < 2) {
              throw new BadRequestException(
                'Pagamento parcelado deve ter pelo menos 2 parcelas',
              );
            }

            if (!pagamento.primeiraParcelaData) {
              throw new BadRequestException(
                'Data da primeira parcela é obrigatória para pagamento parcelado',
              );
            }

            const primeiraParcelaDate = new Date(pagamento.primeiraParcelaData);
            const numeroParcelas = pagamento.numeroParcelas;
            const totalParcelado = new Decimal(pagamento.valor);
            const valorParcelaBase = totalParcelado
              .div(numeroParcelas)
              .toDecimalPlaces(2);

            let acumulado = new Decimal(0);

            for (let i = 1; i <= numeroParcelas; i++) {
              let valorParcela = valorParcelaBase;
              if (i === numeroParcelas) {
                valorParcela = totalParcelado.sub(acumulado);
              } else {
                acumulado = acumulado.add(valorParcelaBase);
              }

              const vencimento = this.addMonths(primeiraParcelaDate, i - 1);

              await tx.parcelas.create({
                data: {
                  parcelamentoId: parcelamento.id,
                  numero: numeroParcela++,
                  valor: valorParcela,
                  vencimento,
                  status: ParcelaStatus.PENDENTE,
                },
              });
            }
            continue;
          }
        }
      }

      // 9. Determinar status final
      let statusFinal: VendaStatus;
      const todosDevolvidos = venda.VendaItem.every(
        item => item.qtdReservada === item.qtdDevolvida,
      );
      const algumDevolvido = venda.VendaItem.some(item => item.qtdDevolvida > 0);

      if (todosDevolvidos) {
        statusFinal = VendaStatus.CANCELADA;
      } else if (algumDevolvido) {
        statusFinal = VendaStatus.CONFIRMADA_PARCIAL;
      } else {
        statusFinal = VendaStatus.CONFIRMADA_TOTAL;
      }

      // 10. Atualizar venda
      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: statusFinal,
          valorFrete,
          desconto: descontoTotal,
          valorComissao,
          valorTotal: totalVenda,
          nomeFatura,
          ruccnpj,
          numeroFatura,
        },
      });

      // 11. Atualizar cliente
      await tx.cliente.update({
        where: { id: venda.clienteId },
        data: {
          ultimaCompra: new Date(),
          qtdCompras: { increment: 1 },
          ruccnpj:
            nomeFatura?.length === 0 && ruccnpj?.length > 0 ? ruccnpj : null,
        },
      });

      // 12. Buscar venda finalizada
      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true } },
          Usuario: { select: { id: true, nome: true } },
          VendaItem: {
            include: {
              ProdutoSKU: {
                include: {
                  produto: {
                    select: {
                      id: true,
                      publicId: true,
                      nome: true,
                      precoVenda: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vendaAtualizada) {
        throw new NotFoundException('Erro ao finalizar condicional');
      }

      return this.mapToVendaEntity(vendaAtualizada);
    });

    // 13. Registrar no rollup (apenas se não foi cancelada)
    if (vendaFinalizada.status !== VendaStatus.CANCELADA) {
      console.log('[VendaService] Calling registerVendaConfirmada after finalizarCondicional:', {
        parceiroId,
        status: vendaFinalizada.status,
        dataVenda: vendaFinalizada.dataVenda,
        tipo: vendaFinalizada.tipo,
        valorTotal: vendaFinalizada.valorTotal,
      });

      await this.vendaRollupService.registerVendaConfirmada({
        parceiroId,
        dataVenda: vendaFinalizada.dataVenda,
        tipo: vendaFinalizada.tipo,
        valorTotal: vendaFinalizada.valorTotal ?? 0,
        descontoTotal: vendaFinalizada.desconto ?? 0,
      });
    }

    return vendaFinalizada;
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    const venda = await this.prisma.venda.findFirst({
      where: { publicId, parceiroId },
      select: { id: true, status: true },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }
    if (venda.status !== VendaStatus.PEDIDO) {
      throw new BadRequestException(
        'Exclusão permitida apenas quando status da venda for PEDIDO',
      );
    }
    await this.prisma.venda.delete({ where: { id: venda.id } });
  }
}
