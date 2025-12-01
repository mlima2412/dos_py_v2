import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegraLancamentoDto } from './dto/create-regra-lancamento.dto';
import { UpdateRegraLancamentoDto } from './dto/update-regra-lancamento.dto';
import { RegraLancamentoAutomatico } from './entities/regra-lancamento.entity';
import { uuidv7 } from 'uuidv7';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RegraLancamentoService {
  constructor(private prisma: PrismaService) {}

  async create(
    createRegraLancamentoDto: CreateRegraLancamentoDto,
    parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    // Verificar se a conta DRE existe
    const contaDre = await this.prisma.contaDRE.findFirst({
      where: { id: createRegraLancamentoDto.contaDreId, parceiroId },
    });

    if (!contaDre) {
      throw new NotFoundException('Conta DRE não encontrada');
    }

    // Verificar se o imposto existe (se informado)
    if (createRegraLancamentoDto.impostoId) {
      const imposto = await this.prisma.imposto.findFirst({
        where: { id: createRegraLancamentoDto.impostoId, parceiroId },
      });

      if (!imposto) {
        throw new NotFoundException('Imposto não encontrado');
      }
    }

    // Verificar se já existe uma regra com o mesmo nome para este parceiro
    const existingRegra = await this.prisma.regraLancamentoAutomatico.findFirst({
      where: {
        parceiroId,
        nome: createRegraLancamentoDto.nome,
      },
    });

    if (existingRegra) {
      throw new ConflictException(
        'Já existe uma regra com este nome para este parceiro',
      );
    }

    const regra = await this.prisma.regraLancamentoAutomatico.create({
      data: {
        publicId: uuidv7(),
        contaDreId: createRegraLancamentoDto.contaDreId,
        parceiroId,
        impostoId: createRegraLancamentoDto.impostoId,
        nome: createRegraLancamentoDto.nome,
        tipoGatilho: createRegraLancamentoDto.tipoGatilho,
        tipoVenda: createRegraLancamentoDto.tipoVenda,
        campoOrigem: createRegraLancamentoDto.campoOrigem,
        percentual: createRegraLancamentoDto.percentual
          ? new Decimal(createRegraLancamentoDto.percentual)
          : null,
        ativo: createRegraLancamentoDto.ativo ?? true,
      },
      include: {
        conta: true,
        imposto: true,
      },
    });

    return regra;
  }

  async findAll(parceiroId: number): Promise<RegraLancamentoAutomatico[]> {
    return this.prisma.regraLancamentoAutomatico.findMany({
      where: { parceiroId, ativo: true },
      orderBy: { nome: 'asc' },
      include: {
        conta: {
          include: {
            grupo: true,
          },
        },
        imposto: true,
      },
    });
  }

  async findByTipoGatilho(
    tipoGatilho: string,
    parceiroId: number,
    tipoVenda?: string,
  ): Promise<RegraLancamentoAutomatico[]> {
    return this.prisma.regraLancamentoAutomatico.findMany({
      where: {
        parceiroId,
        tipoGatilho,
        ativo: true,
        OR: [
          { tipoVenda: null },
          { tipoVenda: tipoVenda },
        ],
      },
      include: {
        conta: true,
        imposto: true,
      },
    });
  }

  async findOne(id: number, parceiroId: number): Promise<RegraLancamentoAutomatico> {
    const regra = await this.prisma.regraLancamentoAutomatico.findFirst({
      where: { id, parceiroId },
      include: {
        conta: {
          include: {
            grupo: true,
          },
        },
        imposto: true,
      },
    });

    if (!regra) {
      throw new NotFoundException('Regra de lançamento não encontrada');
    }

    return regra;
  }

  async findByPublicId(
    publicId: string,
    parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    const regra = await this.prisma.regraLancamentoAutomatico.findFirst({
      where: { publicId, parceiroId },
      include: {
        conta: {
          include: {
            grupo: true,
          },
        },
        imposto: true,
      },
    });

    if (!regra) {
      throw new NotFoundException('Regra de lançamento não encontrada');
    }

    return regra;
  }

  async update(
    id: number,
    updateRegraLancamentoDto: UpdateRegraLancamentoDto,
    parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    // Verificar se a regra existe
    await this.findOne(id, parceiroId);

    // Verificar se a nova conta DRE existe (se informada)
    if (updateRegraLancamentoDto.contaDreId) {
      const contaDre = await this.prisma.contaDRE.findFirst({
        where: { id: updateRegraLancamentoDto.contaDreId, parceiroId },
      });

      if (!contaDre) {
        throw new NotFoundException('Conta DRE não encontrada');
      }
    }

    // Verificar se o novo imposto existe (se informado)
    if (updateRegraLancamentoDto.impostoId) {
      const imposto = await this.prisma.imposto.findFirst({
        where: { id: updateRegraLancamentoDto.impostoId, parceiroId },
      });

      if (!imposto) {
        throw new NotFoundException('Imposto não encontrado');
      }
    }

    // Verificar se o novo nome já existe em outra regra
    if (updateRegraLancamentoDto.nome) {
      const existingRegra = await this.prisma.regraLancamentoAutomatico.findFirst({
        where: {
          parceiroId,
          nome: updateRegraLancamentoDto.nome,
          id: { not: id },
        },
      });

      if (existingRegra) {
        throw new ConflictException(
          'Já existe uma regra com este nome para este parceiro',
        );
      }
    }

    const data: any = { ...updateRegraLancamentoDto };
    if (updateRegraLancamentoDto.percentual !== undefined) {
      data.percentual = new Decimal(updateRegraLancamentoDto.percentual);
    }

    return this.prisma.regraLancamentoAutomatico.update({
      where: { id },
      data,
      include: {
        conta: {
          include: {
            grupo: true,
          },
        },
        imposto: true,
      },
    });
  }

  async remove(id: number, parceiroId: number): Promise<void> {
    // Verificar se a regra existe
    await this.findOne(id, parceiroId);

    // Soft delete - marcar como inativo
    await this.prisma.regraLancamentoAutomatico.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
