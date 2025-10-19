import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { UpdatePagamentoDto } from './dto/update-pagamento.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Pagamento } from './entities/pagamento.entity';

@Injectable()
export class PagamentoService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(pagamento: any): Pagamento {
    return {
      id: pagamento.id,
      vendaId: pagamento.vendaId,
      formaPagamentoId: pagamento.formaPagamentoId,
      tipo: pagamento.tipo,
      valor: Number(pagamento.valor),
      valorDelivery: pagamento.valorDelivery !== null ? Number(pagamento.valorDelivery) : null,
      entrada: pagamento.entrada,
      formaPagamentoNome: pagamento.FormaPagamento?.nome,
    };
  }

  async create(createPagamentoDto: CreatePagamentoDto, parceiroId: number): Promise<Pagamento> {
    // Validar venda pertence ao parceiro
    const venda = await this.prisma.venda.findFirst({
      where: { id: createPagamentoDto.vendaId, parceiroId },
    });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada ou não pertence ao parceiro');
    }

    // Validar forma de pagamento pertence ao parceiro
    const formaPagamento = await this.prisma.formaPagamento.findFirst({
      where: { idFormaPag: createPagamentoDto.formaPagamentoId, parceiroId },
    });
    if (!formaPagamento) {
      throw new NotFoundException('Forma de pagamento não encontrada ou não pertence ao parceiro');
    }

    const pagamento = await this.prisma.pagamento.create({
      data: {
        vendaId: createPagamentoDto.vendaId,
        formaPagamentoId: createPagamentoDto.formaPagamentoId,
        tipo: createPagamentoDto.tipo,
        valor: new Decimal(createPagamentoDto.valor),
        valorDelivery:
          createPagamentoDto.valorDelivery !== undefined && createPagamentoDto.valorDelivery !== null
            ? new Decimal(createPagamentoDto.valorDelivery)
            : undefined,
        entrada: createPagamentoDto.entrada ?? false,
      },
      include: { FormaPagamento: true },
    });

    return this.mapToEntity(pagamento);
  }

  async findAll(vendaId: number, parceiroId: number): Promise<Pagamento[]> {
    if (!vendaId) {
      throw new BadRequestException('vendaId é obrigatório');
    }
    const venda = await this.prisma.venda.findFirst({ where: { id: vendaId, parceiroId } });
    if (!venda) {
      throw new NotFoundException('Venda não encontrada ou não pertence ao parceiro');
    }

    const pagamentos = await this.prisma.pagamento.findMany({
      where: { vendaId },
      include: { FormaPagamento: true },
      orderBy: { id: 'asc' },
    });
    return pagamentos.map((p) => this.mapToEntity(p));
  }

  async findOne(id: number, parceiroId: number): Promise<Pagamento> {
    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id, Venda: { parceiroId } },
      include: { FormaPagamento: true },
    });
    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return this.mapToEntity(pagamento);
  }

  async update(id: number, updatePagamentoDto: UpdatePagamentoDto, parceiroId: number): Promise<Pagamento> {
    // Verificar existência e vínculo com parceiro
    const existing = await this.prisma.pagamento.findFirst({
      where: { id, Venda: { parceiroId } },
      include: { Venda: true },
    });
    if (!existing) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se trocar venda, validar parceria
    if (updatePagamentoDto.vendaId && updatePagamentoDto.vendaId !== existing.vendaId) {
      const venda = await this.prisma.venda.findFirst({
        where: { id: updatePagamentoDto.vendaId, parceiroId },
      });
      if (!venda) {
        throw new NotFoundException('Venda não encontrada ou não pertence ao parceiro');
      }
    }

    // Se trocar forma de pagamento, validar parceria
    if (
      updatePagamentoDto.formaPagamentoId &&
      updatePagamentoDto.formaPagamentoId !== existing.formaPagamentoId
    ) {
      const forma = await this.prisma.formaPagamento.findFirst({
        where: { idFormaPag: updatePagamentoDto.formaPagamentoId, parceiroId },
      });
      if (!forma) {
        throw new NotFoundException('Forma de pagamento não encontrada ou não pertence ao parceiro');
      }
    }

    const data: any = {
      ...updatePagamentoDto,
      valor:
        updatePagamentoDto.valor !== undefined && updatePagamentoDto.valor !== null
          ? new Decimal(updatePagamentoDto.valor)
          : undefined,
      valorDelivery:
        updatePagamentoDto.valorDelivery !== undefined && updatePagamentoDto.valorDelivery !== null
          ? new Decimal(updatePagamentoDto.valorDelivery)
          : undefined,
    };

    const pagamento = await this.prisma.pagamento.update({
      where: { id },
      data,
      include: { FormaPagamento: true },
    });
    return this.mapToEntity(pagamento);
  }

  async remove(id: number, parceiroId: number): Promise<void> {
    const existing = await this.prisma.pagamento.findFirst({
      where: { id, Venda: { parceiroId } },
    });
    if (!existing) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    await this.prisma.pagamento.delete({ where: { id } });
  }
}
