import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormaPagamentoDto } from './dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from './dto/update-forma-pagamento.dto';
import { FormaPagamento } from './entities/forma-pagamento.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FormaPagamentoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createFormaPagamentoDto: CreateFormaPagamentoDto,
    parceiroId: number,
  ): Promise<FormaPagamento> {
    // Verificar se já existe uma forma de pagamento com o mesmo nome para este parceiro
    const existingFormaPagamento = await this.prisma.formaPagamento.findFirst({
      where: {
        nome: createFormaPagamentoDto.nome,
        parceiroId,
      },
    });

    if (existingFormaPagamento) {
      throw new BadRequestException(
        'Já existe uma forma de pagamento com este nome para este parceiro',
      );
    }

    // Criar entidade e validar regras de negócio
    const formaPagamentoData = {
      ...createFormaPagamentoDto,
      parceiroId,
      // Converter taxa para Decimal se fornecida
      taxa: createFormaPagamentoDto.taxa !== undefined 
        ? new Decimal(createFormaPagamentoDto.taxa) 
        : undefined,
    };

    const formaPagamentoEntity = FormaPagamento.create(formaPagamentoData);

    const formaPagamento = await this.prisma.formaPagamento.create({
      data: {
        parceiroId: formaPagamentoEntity.parceiroId,
        nome: formaPagamentoEntity.nome,
        taxa: formaPagamentoEntity.taxa,
        tempoLiberacao: formaPagamentoEntity.tempoLiberacao,
        impostoPosCalculo: formaPagamentoEntity.impostoPosCalculo,
        ativo: formaPagamentoEntity.ativo,
      },
    });

    return this.mapToFormaPagamentoEntity(formaPagamento);
  }

  async findAll(parceiroId: number): Promise<FormaPagamento[]> {
    const formasPagamento = await this.prisma.formaPagamento.findMany({
      where: { parceiroId },
      orderBy: { nome: 'asc' },
    });

    return formasPagamento.map(formaPagamento =>
      this.mapToFormaPagamentoEntity(formaPagamento),
    );
  }

  async findAllActive(parceiroId: number): Promise<FormaPagamento[]> {
    const formasPagamento = await this.prisma.formaPagamento.findMany({
      where: { 
        parceiroId,
        ativo: true,
      },
      orderBy: { nome: 'asc' },
    });

    return formasPagamento.map(formaPagamento =>
      this.mapToFormaPagamentoEntity(formaPagamento),
    );
  }

  async findOne(
    id: number,
    parceiroId: number,
  ): Promise<FormaPagamento> {
    const formaPagamento = await this.prisma.formaPagamento.findFirst({
      where: {
        idFormaPag: id,
        parceiroId,
      },
    });

    if (!formaPagamento) {
      throw new NotFoundException('Forma de pagamento não encontrada');
    }

    return this.mapToFormaPagamentoEntity(formaPagamento);
  }

  async update(
    id: number,
    updateFormaPagamentoDto: UpdateFormaPagamentoDto,
    parceiroId: number,
  ): Promise<FormaPagamento> {
    // Verificar se a forma de pagamento existe
    const existingFormaPagamento = await this.prisma.formaPagamento.findFirst({
      where: {
        idFormaPag: id,
        parceiroId,
      },
    });

    if (!existingFormaPagamento) {
      throw new NotFoundException('Forma de pagamento não encontrada');
    }

    // Verificar se o nome não está sendo usado por outra forma de pagamento
    if (updateFormaPagamentoDto.nome) {
      const duplicateFormaPagamento = await this.prisma.formaPagamento.findFirst({
        where: {
          nome: updateFormaPagamentoDto.nome,
          parceiroId,
          idFormaPag: {
            not: id,
          },
        },
      });

      if (duplicateFormaPagamento) {
        throw new BadRequestException(
          'Já existe uma forma de pagamento com este nome para este parceiro',
        );
      }
    }

    // Preparar dados para atualização, convertendo taxa se necessário
    const updateData = {
      ...updateFormaPagamentoDto,
      taxa: updateFormaPagamentoDto.taxa !== undefined 
        ? new Decimal(updateFormaPagamentoDto.taxa) 
        : undefined,
    };

    const formaPagamento = await this.prisma.formaPagamento.update({
      where: { idFormaPag: id },
      data: updateData,
    });

    return this.mapToFormaPagamentoEntity(formaPagamento);
  }

  async ativar(id: number, parceiroId: number): Promise<FormaPagamento> {
    const formaPagamento = await this.prisma.formaPagamento.findFirst({
      where: {
        idFormaPag: id,
        parceiroId,
      },
    });

    if (!formaPagamento) {
      throw new NotFoundException('Forma de pagamento não encontrada');
    }

    const formaPagamentoAtualizada = await this.prisma.formaPagamento.update({
      where: { idFormaPag: id },
      data: { ativo: true },
    });

    return this.mapToFormaPagamentoEntity(formaPagamentoAtualizada);
  }

  async inativar(id: number, parceiroId: number): Promise<FormaPagamento> {
    const formaPagamento = await this.prisma.formaPagamento.findFirst({
      where: {
        idFormaPag: id,
        parceiroId,
      },
    });

    if (!formaPagamento) {
      throw new NotFoundException('Forma de pagamento não encontrada');
    }

    const formaPagamentoAtualizada = await this.prisma.formaPagamento.update({
      where: { idFormaPag: id },
      data: { ativo: false },
    });

    return this.mapToFormaPagamentoEntity(formaPagamentoAtualizada);
  }

  private mapToFormaPagamentoEntity(data: any): FormaPagamento {
    return new FormaPagamento({
      idFormaPag: data.idFormaPag,
      parceiroId: data.parceiroId,
      nome: data.nome,
      taxa: data.taxa,
      tempoLiberacao: data.tempoLiberacao,
      impostoPosCalculo: data.impostoPosCalculo,
      ativo: data.ativo,
    });
  }
}
