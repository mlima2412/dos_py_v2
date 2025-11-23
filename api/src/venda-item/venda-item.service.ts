import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateVendaItemDto } from './dto/create-venda-item.dto';
import { UpdateVendaItemDto } from './dto/update-venda-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { VendaItemTipo, VendaStatus, DescontoTipo } from '@prisma/client';
import { VendaItemEntity } from './entities/venda-item.entity';

@Injectable()
export class VendaItemService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(data: any): VendaItemEntity {
    return {
      id: data.id,
      vendaId: data.vendaId,
      skuId: data.skuId,
      tipo: data.tipo,
      qtdReservada: data.qtdReservada,
      qtdAceita: data.qtdAceita,
      qtdDevolvida: data.qtdDevolvida,
      desconto: data.desconto != null ? Number(data.desconto) : null,
      descontoTipo: data.descontoTipo ?? null,
      descontoValor: data.descontoValor != null ? Number(data.descontoValor) : null,
      precoUnit: Number(data.precoUnit),
      skuPublicId: data.ProdutoSKU?.publicId,
      skuCor: data.ProdutoSKU?.cor ?? null,
      skuCodCor: data.ProdutoSKU?.codCor ?? null,
      skuTamanho: data.ProdutoSKU?.tamanho ?? null,
    };
  }

  /**
   * Calcula o desconto em valor absoluto baseado no tipo e valor informado
   */
  private calculateDesconto(
    descontoTipo: DescontoTipo | undefined,
    descontoValor: number | undefined,
    precoUnit: Decimal,
    qtdReservada: number,
  ): Decimal {
    if (!descontoValor || descontoValor <= 0) {
      return new Decimal(0);
    }

    const tipo = descontoTipo ?? DescontoTipo.VALOR;

    if (tipo === DescontoTipo.PERCENTUAL) {
      // Desconto percentual: calcula sobre o total do item (preço * quantidade)
      const totalItem = precoUnit.mul(qtdReservada);
      return totalItem.mul(descontoValor).div(100);
    } else {
      // Desconto em valor: usa o valor direto
      return new Decimal(descontoValor);
    }
  }

  async create(createVendaItemDto: CreateVendaItemDto, parceiroId: number): Promise<VendaItemEntity> {
    // Garantir que a venda exista e pertença ao parceiro
    const venda = await this.prisma.venda.findUnique({
      where: { id: createVendaItemDto.vendaId },
      select: { id: true, parceiroId: true },
    });
    if (!venda) {
      throw new BadRequestException('Venda inválida');
    }
    if (venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Venda não pertence ao parceiro informado');
    }

    // Garantir que o SKU exista e pertença ao parceiro
    const sku = await this.prisma.produtoSKU.findUnique({
      where: { id: createVendaItemDto.skuId },
      select: { id: true, produto: { select: { parceiroId: true } } },
    });
    if (!sku) {
      throw new BadRequestException('SKU inválido');
    }
    if (sku.produto.parceiroId !== parceiroId) {
      throw new ForbiddenException('SKU não pertence ao parceiro informado');
    }

    const precoUnit = new Decimal(createVendaItemDto.precoUnit);
    const descontoCalculado = this.calculateDesconto(
      createVendaItemDto.descontoTipo,
      createVendaItemDto.descontoValor ?? undefined,
      precoUnit,
      createVendaItemDto.qtdReservada,
    );

    const created = await this.prisma.vendaItem.create({
      data: {
        vendaId: createVendaItemDto.vendaId,
        skuId: createVendaItemDto.skuId,
        tipo: createVendaItemDto.tipo ?? VendaItemTipo.NORMAL,
        qtdReservada: createVendaItemDto.qtdReservada,
        qtdAceita: createVendaItemDto.qtdAceita ?? 0,
        qtdDevolvida: createVendaItemDto.qtdDevolvida ?? 0,
        desconto: descontoCalculado,
        descontoTipo: createVendaItemDto.descontoTipo ?? DescontoTipo.VALOR,
        descontoValor: createVendaItemDto.descontoValor != null ? new Decimal(createVendaItemDto.descontoValor) : undefined,
        precoUnit,
      },
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
        ProdutoSKU: {
          select: {
            publicId: true,
            cor: true,
            codCor: true,
            tamanho: true,
          },
        },
      },
    });
    return this.mapToEntity(created);
  }

  async findAll(vendaId: number, parceiroId: number): Promise<VendaItemEntity[]> {
    // Verificar venda e parceiro
    const venda = await this.prisma.venda.findUnique({
      where: { id: vendaId },
      select: { id: true, parceiroId: true },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada');
    }
    if (venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Venda não pertence ao parceiro informado');
    }

    const items = await this.prisma.vendaItem.findMany({
      where: { vendaId },
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
        ProdutoSKU: {
          select: {
            publicId: true,
            cor: true,
            codCor: true,
            tamanho: true,
          },
        },
      },
    });
    return items.map(i => this.mapToEntity(i));
  }

  async findOne(id: number, vendaId: number, parceiroId: number): Promise<VendaItemEntity> {
    const item = await this.prisma.vendaItem.findFirst({
      where: { id, vendaId },
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
        ProdutoSKU: {
          select: {
            publicId: true,
            cor: true,
            codCor: true,
            tamanho: true,
          },
        },
        Venda: { select: { parceiroId: true } },
      },
    });
    if (!item) {
      throw new NotFoundException('Item de venda não encontrado');
    }
    if (item.Venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Venda não pertence ao parceiro informado');
    }
    return this.mapToEntity(item);
  }

  async update(
    id: number,
    vendaId: number,
    updateVendaItemDto: UpdateVendaItemDto,
    parceiroId: number,
  ): Promise<VendaItemEntity> {
    const existing = await this.prisma.vendaItem.findFirst({
      where: { id, vendaId },
      select: { id: true, Venda: { select: { parceiroId: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Item de venda não encontrado');
    }
    if (existing.Venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Venda não pertence ao parceiro informado');
    }

    // Se descontoTipo ou descontoValor foram fornecidos, recalcular o desconto
    let descontoCalculado: Decimal | undefined = undefined;
    if (updateVendaItemDto.descontoTipo !== undefined || updateVendaItemDto.descontoValor !== undefined) {
      const precoUnit = updateVendaItemDto.precoUnit != null
        ? new Decimal(updateVendaItemDto.precoUnit)
        : new Decimal((existing as any).precoUnit ?? 0);
      const qtdReservada = updateVendaItemDto.qtdReservada ?? (existing as any).qtdReservada ?? 1;

      descontoCalculado = this.calculateDesconto(
        updateVendaItemDto.descontoTipo,
        updateVendaItemDto.descontoValor ?? undefined,
        precoUnit,
        qtdReservada,
      );
    }

    const updated = await this.prisma.vendaItem.update({
      where: { id },
      data: {
        tipo: updateVendaItemDto.tipo ?? undefined,
        qtdReservada: updateVendaItemDto.qtdReservada ?? undefined,
        qtdAceita: updateVendaItemDto.qtdAceita ?? undefined,
        qtdDevolvida: updateVendaItemDto.qtdDevolvida ?? undefined,
        desconto: descontoCalculado,
        descontoTipo: updateVendaItemDto.descontoTipo ?? undefined,
        descontoValor: updateVendaItemDto.descontoValor != null
          ? new Decimal(updateVendaItemDto.descontoValor)
          : undefined,
        precoUnit:
          updateVendaItemDto.precoUnit != null
            ? new Decimal(updateVendaItemDto.precoUnit)
            : undefined,
      },
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
        ProdutoSKU: {
          select: {
            publicId: true,
            cor: true,
            codCor: true,
            tamanho: true,
          },
        },
      },
    });
    return this.mapToEntity(updated);
  }

  async remove(id: number, vendaId: number, parceiroId: number): Promise<void> {
    const item = await this.prisma.vendaItem.findFirst({
      where: { id, vendaId },
      select: { id: true, Venda: { select: { parceiroId: true, status: true } } },
    });
    if (!item) {
      throw new NotFoundException('Item de venda não encontrado');
    }
    if (item.Venda.parceiroId !== parceiroId) {
      throw new ForbiddenException('Venda não pertence ao parceiro informado');
    }
    if (item.Venda.status !== VendaStatus.PEDIDO) {
      throw new BadRequestException('Exclusão permitida apenas quando status da venda for PEDIDO');
    }

    await this.prisma.vendaItem.delete({ where: { id: item.id } });
  }
}
