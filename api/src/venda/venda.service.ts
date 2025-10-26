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

@Injectable()
export class VendaService {
  constructor(private readonly prisma: PrismaService) {}

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
      clienteSobrenome: data.Cliente?.sobrenome,
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
            precoUnit: Number(vi.precoUnit),
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
    return this.mapToVendaEntity(created);
  }

  async finalizarDireta(
    publicId: string,
    finalizeDto: FinalizeVendaDiretaDto,
    parceiroId: number,
    usuarioId: number,
  ): Promise<Venda> {
    return this.prisma.$transaction(async tx => {
      const venda = await tx.venda.findFirst({
        where: { publicId, parceiroId },
        include: {
          Cliente: { select: { id: true, nome: true, sobrenome: true } },
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
      await tx.parcelas.deleteMany({
        where: {
          Parcelamento: {
            Pagamento: {
              vendaId: venda.id,
            },
          },
        },
      });
      await tx.parcelamento.deleteMany({
        where: {
          Pagamento: {
            vendaId: venda.id,
          },
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

        await tx.vendaItem.update({
          where: { id: item.id },
          data: {
            qtdAceita: item.qtdReservada,
            qtdDevolvida: 0,
          },
        });
      }

      // Criar pagamentos e parcelamentos
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

        const pagamentoCriado = await tx.pagamento.create({
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

        if (pagamento.tipo === TipoVenda.A_VISTA_IMEDIATA) {
          continue;
        }

        const parcelamento = await tx.parcelamento.create({
          data: {
            idPagamento: pagamentoCriado.id,
            clienteId: venda.clienteId,
            valorTotal: pagamento.valor,
            valorPago: 0,
            idFormaPag: pagamento.formaPagamentoId,
            situacao: 1,
          },
        });

        if (pagamento.tipo === TipoVenda.A_PRAZO_SEM_PARCELAS) {
          if (!pagamento.vencimento) {
            throw new BadRequestException(
              'Data de vencimento obrigatória para pagamento a prazo',
            );
          }

          await tx.parcelas.create({
            data: {
              parcelamentoId: parcelamento.id,
              numero: 1,
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
                numero: i,
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

      // Atualizar venda com totais e status
      await tx.venda.update({
        where: { id: venda.id },
        data: {
          status: VendaStatus.CONFIRMADA_TOTAL,
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
            nomeFatura.length === 0 && ruccnpj.length > 0 ? ruccnpj : null,
        },
      });

      const vendaAtualizada = await tx.venda.findUnique({
        where: { id: venda.id },
        include: {
          Cliente: { select: { id: true, nome: true, sobrenome: true } },
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
        Cliente: { select: { id: true, nome: true, sobrenome: true } },
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
  ): Promise<{ data: Venda[]; total: number; page: number; limit: number }> {
    const where: any = { parceiroId };
    if (status) {
      where.status = status;
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
          ruccnpj: true,
          numeroFatura: true,
          observacao: true,
          valorComissao: true,
          Cliente: { select: { id: true, nome: true, sobrenome: true } },
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
        ruccnpj: true,
        numeroFatura: true,
        observacao: true,
        valorComissao: true,
        Cliente: { select: { id: true, nome: true, sobrenome: true } },
        Usuario: { select: { id: true, nome: true } },
        // Evitar incluir outras relações na busca principal
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
