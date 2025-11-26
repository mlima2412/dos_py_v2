🎯 PLANO DE IMPLEMENTAÇÃO REVISADO - Vendas Condicionais
📋 Análise Completa Revisada
Fluxo de Negócio Correto da Condicional:
Etapa 1: Envio dos Produtos ao Cliente (Status: PEDIDO → CONFIRMADA)
Cliente leva produtos em condicional
Estoque É BAIXADO imediatamente (saída física)
Venda passa de PEDIDO para CONFIRMADA (ou ABERTA)
Criar MovimentoEstoque tipo CONDICIONAL (nova operação de saída)
qtdReservada = quantidade enviada ao cliente
qtdAceita = 0 (ainda não decidiu)
qtdDevolvida = 0 (ainda não devolveu)
NÃO gera pagamento ainda (cliente vai decidir)
NÃO registra no rollup ainda (venda não confirmada)
Etapa 2: Processamento das Devoluções (Status: ABERTA)
Cliente devolve produtos (parcial ou total)
Produtos devolvidos RETORNAM ao estoque (entrada)
Criar MovimentoEstoque tipo DEVOLUCAO (entrada)
Frontend: escanear código de barras para marcar devolvidos
qtdDevolvida incrementa
Estoque do local de origem incrementa
Etapa 3: Finalização (Status Final)
Cliente decide o que fica
qtdAceita = qtdReservada - qtdDevolvida (calculado)
NÃO baixa estoque novamente (já foi baixado na Etapa 1)
Registra pagamentos apenas dos itens aceitos
Atualiza rollup Redis com valor final da venda
Determinar status final:
Se qtdDevolvida = qtdReservada (todos devolvidos): Status CANCELADA
Se qtdDevolvida > 0 E qtdAceita > 0: Status CONFIRMADA_PARCIAL
Se qtdDevolvida = 0 (ficou com tudo): Status CONFIRMADA_TOTAL
🗂️ Mudanças no Schema Prisma
Adicionar novo tipo de movimento
enum TipoMovimento {
ENTRADA
SAIDA
TRANSFERENCIA
CONDICIONAL // ← ADICIONAR (saída para condicional)
DEVOLUCAO // ← JÁ EXISTE
AJUSTE
}
Ajustar enum de status (opcional, mas recomendado)
enum VendaStatus {
PEDIDO // Rascunho/orçamento
ABERTA // ← ADICIONAR (condicional em andamento)
CONFIRMADA // Finalizada sem detalhes
CONFIRMADA_PARCIAL // Condicional com devoluções parciais
CONFIRMADA_TOTAL // Condicional sem devoluções OU venda direta
CANCELADA // Todos os itens devolvidos
}
🎯 PLANO DE IMPLEMENTAÇÃO REVISADO
FASE 1: Backend - Ajustes no Schema e Migrations
1.1 Atualizar Prisma Schema

# Adicionar ABERTA ao enum VendaStatus (se não existir)

# TipoMovimento.CONDICIONAL já existe no schema

1.2 Criar Migration
cd api
npx prisma migrate dev --name add_aberta_status_condicional
npx prisma generate
FASE 2: Backend - Novos DTOs
2.1 DTO para processar devolução de item
Arquivo: api/src/venda/dto/process-devolucao-item.dto.ts
import { IsInt, IsPositive, Min } from 'class-validator';

export class ProcessDevolucaoItemDto {
@IsInt()
@IsPositive()
skuId: number;

@IsInt()
@Min(1)
qtdDevolvida: number; // quantidade sendo devolvida NESTA operação
}
2.2 DTO para finalizar condicional
Arquivo: api/src/venda/dto/finalize-venda-condicional.dto.ts
import {
ArrayMinSize,
IsArray,
IsNumber,
IsOptional,
IsString,
MaxLength,
Min,
ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FinalizeVendaDiretaPagamentoDto } from './finalize-venda-direta.dto';

export class FinalizeVendaCondicionalDto {
@IsOptional()
@IsNumber()
@Min(0)
valorFrete?: number | null;

@IsOptional()
@IsNumber()
@Min(0)
descontoTotal?: number | null;

@IsOptional()
@IsNumber()
@Min(0)
valorComissao?: number | null;

@IsOptional()
@IsString()
@MaxLength(255)
numeroFatura?: string | null;

@IsOptional()
@IsString()
@MaxLength(255)
nomeFatura?: string | null;

@IsOptional()
@IsString()
@MaxLength(255)
ruccnpj?: string | null;

@IsArray()
@ArrayMinSize(1)
@ValidateNested({ each: true })
@Type(() => FinalizeVendaDiretaPagamentoDto)
pagamentos: FinalizeVendaDiretaPagamentoDto[];
}
FASE 3: Backend - Novos Endpoints no Controller
Arquivo: api/src/venda/venda.controller.ts
3.1 Endpoint para confirmar condicional (envia produtos ao cliente)
@Patch(':publicId/confirmarCondicional')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
name: 'x-parceiro-id',
description: 'ID do parceiro logado',
required: true,
schema: { type: 'integer', example: 1 },
})
@ApiOperation({
summary: 'Confirmar envio de produtos em condicional (baixa estoque, NÃO gera pagamento)',
})
@ApiParam({ name: 'publicId', description: 'ID público da venda' })
@ApiResponse({ status: 200, description: 'Condicional confirmada', type: Venda })
confirmarCondicional(
@Param('publicId') publicId: string,
@ParceiroId() parceiroId: number,
@UserId() usuarioId: number,
): Promise<Venda> {
return this.vendaService.confirmarCondicional(
publicId,
parceiroId,
usuarioId,
);
}
3.2 Endpoint para processar devolução
@Patch(':publicId/processarDevolucao')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
name: 'x-parceiro-id',
description: 'ID do parceiro logado',
required: true,
schema: { type: 'integer', example: 1 },
})
@ApiOperation({
summary: 'Processar devolução de item condicional (retorna ao estoque)',
})
@ApiParam({ name: 'publicId', description: 'ID público da venda' })
@ApiResponse({ status: 200, description: 'Devolução processada', type: Venda })
processarDevolucao(
@Param('publicId') publicId: string,
@Body() devolucaoDto: ProcessDevolucaoItemDto,
@ParceiroId() parceiroId: number,
@UserId() usuarioId: number,
): Promise<Venda> {
return this.vendaService.processarDevolucao(
publicId,
devolucaoDto,
parceiroId,
usuarioId,
);
}
3.3 Endpoint para finalizar condicional
@Patch(':publicId/finalizarCondicional')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
name: 'x-parceiro-id',
description: 'ID do parceiro logado',
required: true,
schema: { type: 'integer', example: 1 },
})
@ApiOperation({
summary: 'Finalizar venda condicional com pagamentos (calcula itens aceitos)',
})
@ApiParam({ name: 'publicId', description: 'ID público da venda' })
@ApiResponse({ status: 200, description: 'Condicional finalizada', type: Venda })
finalizarCondicional(
@Param('publicId') publicId: string,
@Body() finalizeDto: FinalizeVendaCondicionalDto,
@ParceiroId() parceiroId: number,
@UserId() usuarioId: number,
): Promise<Venda> {
return this.vendaService.finalizarCondicional(
publicId,
finalizeDto,
parceiroId,
usuarioId,
);
}
FASE 4: Backend - Lógica de Negócio no Service
Arquivo: api/src/venda/venda.service.ts
4.1 Método confirmarCondicional
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
      throw new BadRequestException('Apenas vendas condicionais podem usar este endpoint');
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
4.2 Método processarDevolucao
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
      throw new BadRequestException('Apenas vendas condicionais podem ter devoluções');
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
4.3 Método finalizarCondicional
async finalizarCondicional(
publicId: string,
finalizeDto: FinalizeVendaCondicionalDto,
parceiroId: number,
usuarioId: number,
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
      throw new BadRequestException('Apenas vendas condicionais podem usar este endpoint');
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

    // 5. Atualizar qtdAceita em cada item
    for (const item of venda.VendaItem) {
      const qtdAceita = item.qtdReservada - item.qtdDevolvida;
      await tx.vendaItem.update({
        where: { id: item.id },
        data: {
          qtdAceita,
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
FASE 5: Frontend - Tipos e Interfaces
Arquivo: admin/src/pages/vendas/types.ts Adicionar novos tipos:
export interface VendaItemFormData {
remoteId?: number;
skuId: number;
productId?: number;
qtdReservada: number;
qtdDevolvida?: number; // ← ADICIONAR
qtdAceita?: number; // ← ADICIONAR
precoUnit: number;
desconto?: number;
descontoTipo?: DescontoTipo;
descontoValor?: number;
observacao?: string;
tipo?: VendaItemEntity["tipo"];
productName?: string;
skuLabel?: string;
skuColor?: string | null;
skuColorCode?: string | null;
skuSize?: string | null;
}

export interface VendaFormHandlers {
onAddSku: (
sku: ProdutoSKUEstoqueResponseDto,
product: ProdutosPorLocalResponseDto,
discountValue?: number,
discountType?: DescontoTipo
) => Promise<boolean>;
onRemoveItem: (skuId: number) => Promise<void>;
onUpdateQuantity: (skuId: number, qty: number) => Promise<void>;
onUpdateDiscount: (skuId: number, discountValue: number, discountType: DescontoTipo) => Promise<void>;
onSearchSkuByCode: (
discountValue?: number,
discountType?: DescontoTipo
) => Promise<null | {
sku: ProdutoSKUEstoqueResponseDto;
product: ProdutosPorLocalResponseDto;
}>;
onProcessarDevolucao?: (skuId: number) => Promise<void>; // ← ADICIONAR
}
FASE 6: Frontend - Hook para Devolução
Arquivo: admin/src/pages/vendas/hooks/useCondicionalDevolucao.ts (CRIAR)
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { useVendaControllerProcessarDevolucao } from "@/api-client";
import type { VendaItemFormData } from "../types";

export const useCondicionalDevolucao = (
vendaPublicId: string | undefined,
parceiroId: number | null,
itensSelecionados: VendaItemFormData[],
onDevolucaoSuccess: () => void
) => {
const { t } = useTranslation("common");
const { success: showSuccess, error: showError } = useToast();
const [isProcessing, setIsProcessing] = useState(false);

const devolucaoMutation = useVendaControllerProcessarDevolucao({
mutation: {
onSuccess: () => {
showSuccess(t("salesOrders.form.messages.returnProcessed"));
onDevolucaoSuccess();
},
onError: (error) => {
console.error("Erro ao processar devolução:", error);
const mensagem =
error?.data?.message ?? t("salesOrders.form.messages.returnError");
showError(mensagem);
},
},
});

const processarDevolucao = async (skuId: number) => {
if (!vendaPublicId || !parceiroId) {
showError("Venda não identificada");
return;
}

    const item = itensSelecionados.find(i => i.skuId === skuId);
    if (!item) {
      showError("Item não encontrado na venda");
      return;
    }

    const qtdJaDevolvida = item.qtdDevolvida ?? 0;
    const qtdRestante = item.qtdReservada - qtdJaDevolvida;

    if (qtdRestante <= 0) {
      showError(t("salesOrders.form.messages.itemAlreadyReturned"));
      return;
    }

    setIsProcessing(true);
    try {
      await devolucaoMutation.mutateAsync({
        publicId: vendaPublicId,
        headers: {
          "x-parceiro-id": parceiroId,
        },
        data: {
          skuId,
          qtdDevolvida: 1, // Cada scan = 1 unidade devolvida
        },
      });
    } finally {
      setIsProcessing(false);
    }

};

return {
processarDevolucao,
isProcessing: isProcessing || devolucaoMutation.isPending,
};
};
FASE 7: Frontend - Componentes UI
7.1 Modificar SelectedSkuItem.tsx
Arquivo: admin/src/components/SelectedSkuItem.tsx Adicionar props para mostrar itens devolvidos:
export interface SelectedSkuItemProps<T = Record<string, unknown>> {
// ... props existentes
qtdDevolvida?: number; // ← ADICIONAR
qtdReservada?: number; // ← ADICIONAR
isReturned?: boolean; // ← ADICIONAR (qtdDevolvida >= qtdReservada)
}

export const SelectedSkuItem = <T,>({
// ... props existentes
qtdDevolvida = 0,
qtdReservada,
isReturned = false,
}: SelectedSkuItemProps<T>) => {
// ... código existente

return (
<div
ref={el => setRef?.(sku.id, el)}
className={cn(
"flex items-center justify-between p-1.5 border rounded-md transition-all duration-300 hover:border-[#FB5A4F] cursor-pointer",
isReturned && "opacity-50 bg-muted line-through" // ← ADICIONAR visual de devolvido
)}
onDoubleClick={() => onDoubleClick?.(sku.id)} >
<div className="flex-1 min-w-0">
{/_ ... código existente _/}

        {/* ADICIONAR indicador de devolução */}
        {qtdReservada && qtdDevolvida > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-orange-600">
              Devolvido: {qtdDevolvida}/{qtdReservada}
            </span>
          </div>
        )}
        {isReturned && (
          <span className="text-xs text-red-600 font-semibold">
            ✓ Totalmente Devolvido
          </span>
        )}
      </div>
      {/* ... resto do código */}
    </div>

);
};
7.2 Modificar SelectedSkusList.tsx
Arquivo: admin/src/components/SelectedSkusList.tsx Passar props de devolução:
<SelectedSkuItem
key={sku.id}
sku={sku}
product={product}
quantity={quantity}
qtdDevolvida={item.qtdDevolvida} // ← ADICIONAR
qtdReservada={item.qtdReservada} // ← ADICIONAR
isReturned={item.qtdDevolvida >= item.qtdReservada} // ← ADICIONAR
onRemove={onRemoveSku}
onIncrement={handleIncrement}
onDecrement={handleDecrement}
isAtMaxLimit={isAtMaxLimit}
enabledStockAdjustment={enabledStockAdjustment}
setRef={(skuId, el) => {
if (el) {
itemRefs.current.set(skuId, el);
} else {
itemRefs.current.delete(skuId);
}
}}
showDiscount={showDiscount}
discount={discount}
price={price}
onDoubleClick={onEditDiscount}
/>
7.3 Modificar SelecaoItens.tsx
Arquivo: admin/src/pages/vendas/components/SelecaoItens.tsx Adicionar lógica para modo devolução:
interface SelecaoItensProps {
// ... props existentes
isCondicionalAberta?: boolean; // ← ADICIONAR
onProcessarDevolucao?: (skuId: number) => Promise<void>; // ← ADICIONAR
}

export const SelecaoItens: React.FC<SelecaoItensProps> = ({
// ... props existentes
isCondicionalAberta = false,
onProcessarDevolucao,
}) => {
// ... código existente

const handleBarcodeSearch = async () => {
// Se é condicional aberta, processar devolução
if (isCondicionalAberta && onProcessarDevolucao) {
const result = await findSkuByCode();
if (result) {
await onProcessarDevolucao(result.sku.id);
}
return;
}

    // Senão, comportamento normal (adicionar item)
    const result = await findSkuByCode();
    if (result) {
      await handleAddSkuWithDiscount(result.sku, result.product);
    }

};

return (
<div className="space-y-4">
{/_ ... código existente _/}

      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            {isCondicionalAberta
              ? t("salesOrders.form.sections.returnItems")
              : t("salesOrders.form.sections.selectedItems")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={skuSearchCode}
              onChange={event => setSkuSearchCode(event.target.value)}
              placeholder={
                isCondicionalAberta
                  ? t("salesOrders.form.placeholders.scanToReturn")
                  : t("salesOrders.form.placeholders.barcode")
              }
              disabled={isViewMode && !isCondicionalAberta} // ← MODIFICAR
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleBarcodeSearch();
                }
              }}
            />
          </div>
          {/* ... resto do código */}
        </CardContent>
      </Card>
    </div>

);
};
7.4 Modificar FormularioVenda.tsx
Arquivo: admin/src/pages/vendas/FormularioVenda.tsx Adicionar lógica de condicional:
import { useCondicionalDevolucao } from "./hooks/useCondicionalDevolucao";

export const FormularioVenda: React.FC<FormularioVendaProps> = ({ mode }) => {
// ... código existente

const tipoVenda = watch("tipo");
const isCondicionalAberta = useMemo(() => {
return (
tipoVenda === "CONDICIONAL" &&
vendaResumo?.status === "ABERTA"
);
}, [tipoVenda, vendaResumo?.status]);

// Hook de devolução
const { processarDevolucao, isProcessing } = useCondicionalDevolucao(
vendaResumo?.publicId,
parceiroIdNumber,
itensSelecionados,
() => {
// Callback após devolução bem-sucedida
queryClient.invalidateQueries({
queryKey: vendaControllerFindOneQueryKey(vendaResumo?.publicId ?? ""),
});
}
);

// ... resto do código

return (
<div className="space-y-6">
{/_ ... código existente _/}

      {activeStep === "items" && (
        <SelecaoItens
          mode={effectiveMode}
          vendaId={vendaResumo?.id}
          produtosDisponiveis={dataHook.produtosDisponiveis}
          isLoadingProdutos={dataHook.isLoadingProdutos}
          produtosError={dataHook.produtosError}
          selectedLocal={selectedLocal}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          skuSearchCode={skuSearchCode}
          setSkuSearchCode={setSkuSearchCode}
          itensSelecionados={itensSelecionados}
          totals={totals}
          formatCurrency={formatCurrency}
          handlers={handlers}
          skuListingRef={skuListingRef}
          selectedSkusRef={selectedSkusRef}
          findSkuByCode={findSkuByCode}
          onBack={() => setActiveStep("basic")}
          onNext={() =>
            setActiveStep(shouldShowBillingAndPayment ? "billing" : "review")
          }
          isCondicionalAberta={isCondicionalAberta} // ← ADICIONAR
          onProcessarDevolucao={processarDevolucao}  // ← ADICIONAR
        />
      )}

      {/* ... resto do código */}
    </div>

);
};
FASE 8: i18n - Traduções
Arquivo: admin/src/i18n/locales/pt/common.json
{
"salesOrders": {
"form": {
"sections": {
"returnItems": "Processar Devoluções"
},
"actions": {
"confirmConditional": "Confirmar Envio",
"finalizeConditional": "Finalizar Condicional",
"processReturn": "Processar Devolução"
},
"messages": {
"returnProcessed": "Devolução processada com sucesso",
"conditionalFinalized": "Venda condicional finalizada",
"returnError": "Erro ao processar devolução",
"itemAlreadyReturned": "Este item já foi totalmente devolvido",
"allItemsReturned": "Todos os itens foram devolvidos"
},
"placeholders": {
"scanToReturn": "Escanear código para devolver"
},
"labels": {
"returnedQuantity": "Qtd Devolvida",
"acceptedQuantity": "Qtd Aceita"
}
}
}
}
Arquivo: admin/src/i18n/locales/es/common.json
{
"salesOrders": {
"form": {
"sections": {
"returnItems": "Procesar Devoluciones"
},
"actions": {
"confirmConditional": "Confirmar Envío",
"finalizeConditional": "Finalizar Condicional",
"processReturn": "Procesar Devolución"
},
"messages": {
"returnProcessed": "Devolución procesada con éxito",
"conditionalFinalized": "Venta condicional finalizada",
"returnError": "Error al procesar devolución",
"itemAlreadyReturned": "Este artículo ya fue devuelto completamente",
"allItemsReturned": "Todos los artículos fueron devueltos"
},
"placeholders": {
"scanToReturn": "Escanear código para devolver"
},
"labels": {
"returnedQuantity": "Cant Devuelta",
"acceptedQuantity": "Cant Aceptada"
}
}
}
}
📊 Resumo de Arquivos a Modificar/Criar (REVISADO)
Backend:
✏️ api/prisma/schema.prisma (MODIFICAR - adicionar ABERTA ao VendaStatus)
✏️ api/src/venda/dto/process-devolucao-item.dto.ts (CRIAR)
✏️ api/src/venda/dto/finalize-venda-condicional.dto.ts (CRIAR)
✏️ api/src/venda/venda.controller.ts (MODIFICAR - adicionar 3 endpoints)
✏️ api/src/venda/venda.service.ts (MODIFICAR - adicionar 3 métodos)
Frontend:
✏️ admin/src/pages/vendas/types.ts (MODIFICAR - adicionar campos qtdDevolvida/qtdAceita)
✏️ admin/src/pages/vendas/hooks/useCondicionalDevolucao.ts (CRIAR)
✏️ admin/src/pages/vendas/FormularioVenda.tsx (MODIFICAR - integrar devolução)
✏️ admin/src/pages/vendas/components/SelecaoItens.tsx (MODIFICAR - modo devolução)
✏️ admin/src/pages/vendas/components/Pagamento.tsx (MODIFICAR - botão finalizar condicional)
✏️ admin/src/components/SelectedSkusList.tsx (MODIFICAR - passar props devolução)
✏️ admin/src/components/SelectedSkuItem.tsx (MODIFICAR - visual devolvido)
✏️ admin/src/i18n/locales/pt/common.json (MODIFICAR - adicionar traduções)
✏️ admin/src/i18n/locales/es/common.json (MODIFICAR - adicionar traduções)
✅ Validações Finais
✅ Etapa 1: Baixa estoque ao enviar produtos (movimento CONDICIONAL)
✅ Etapa 2: Devolução retorna produtos ao estoque (movimento DEVOLUCAO)
✅ Etapa 3: Finalização calcula qtdAceita e gera pagamentos
✅ Rollup: Só registra vendas finalizadas com status CONFIRMADA\_\*
✅ UX: Campo de código habilitado para condicionais abertas
✅ Visual: Itens devolvidos aparecem com strikethrough e opacidade
