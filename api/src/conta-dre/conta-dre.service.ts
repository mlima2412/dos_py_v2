import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContaDreDto } from './dto/create-conta-dre.dto';
import { UpdateContaDreDto } from './dto/update-conta-dre.dto';
import { ContaDRE } from './entities/conta-dre.entity';
import { uuidv7 } from 'uuidv7';
import { TipoDRE } from '@prisma/client';

@Injectable()
export class ContaDreService {
  constructor(private prisma: PrismaService) {}

  async create(
    createContaDreDto: CreateContaDreDto,
    parceiroId: number,
  ): Promise<ContaDRE> {
    // Verificar se o grupo existe
    const grupo = await this.prisma.grupoDRE.findUnique({
      where: { id: createContaDreDto.grupoId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo DRE não encontrado');
    }

    // Verificar se já existe uma conta com o mesmo nome neste grupo/parceiro
    const existingConta = await this.prisma.contaDRE.findFirst({
      where: {
        grupoId: createContaDreDto.grupoId,
        parceiroId,
        nome: createContaDreDto.nome,
      },
    });

    if (existingConta) {
      throw new ConflictException(
        'Já existe uma conta com este nome neste grupo',
      );
    }

    const conta = await this.prisma.contaDRE.create({
      data: {
        publicId: uuidv7(),
        grupoId: createContaDreDto.grupoId,
        parceiroId,
        codigo: createContaDreDto.codigo,
        nome: createContaDreDto.nome,
        nomeV1: createContaDreDto.nomeV1,
        ordem: createContaDreDto.ordem,
        ativo: createContaDreDto.ativo ?? true,
      },
    });

    return conta;
  }

  async findAll(
    parceiroId: number,
    incluirInativos?: boolean,
  ): Promise<ContaDRE[]> {
    return this.prisma.contaDRE.findMany({
      where: {
        parceiroId,
        ...(incluirInativos ? {} : { ativo: true }),
      },
      orderBy: [{ grupoId: 'asc' }, { ordem: 'asc' }],
      include: {
        grupo: true,
      },
    });
  }

  async findByGrupo(grupoId: number, parceiroId: number): Promise<ContaDRE[]> {
    return this.prisma.contaDRE.findMany({
      where: { grupoId, parceiroId, ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }

  async findByGrupoTipo(
    tipoGrupo: TipoDRE,
    parceiroId: number,
  ): Promise<ContaDRE[]> {
    return this.prisma.contaDRE.findMany({
      where: {
        parceiroId,
        ativo: true,
        grupo: {
          tipo: tipoGrupo,
          ativo: true,
        },
      },
      orderBy: [{ nome: 'asc' }],
      include: {
        grupo: true,
      },
    });
  }

  async findOne(id: number, parceiroId: number): Promise<ContaDRE> {
    const conta = await this.prisma.contaDRE.findFirst({
      where: { id, parceiroId },
      include: {
        grupo: true,
      },
    });

    if (!conta) {
      throw new NotFoundException('Conta DRE não encontrada');
    }

    return conta;
  }

  async findByPublicId(publicId: string, parceiroId: number): Promise<ContaDRE> {
    const conta = await this.prisma.contaDRE.findFirst({
      where: { publicId, parceiroId },
      include: {
        grupo: true,
      },
    });

    if (!conta) {
      throw new NotFoundException('Conta DRE não encontrada');
    }

    return conta;
  }

  async update(
    id: number,
    updateContaDreDto: UpdateContaDreDto,
    parceiroId: number,
  ): Promise<ContaDRE> {
    // Verificar se a conta existe
    await this.findOne(id, parceiroId);

    // Verificar se o novo nome já existe em outra conta do mesmo grupo
    if (updateContaDreDto.nome || updateContaDreDto.grupoId) {
      const conta = await this.prisma.contaDRE.findUnique({ where: { id } });
      const grupoId = updateContaDreDto.grupoId ?? conta.grupoId;
      const nome = updateContaDreDto.nome ?? conta.nome;

      const existingConta = await this.prisma.contaDRE.findFirst({
        where: {
          grupoId,
          parceiroId,
          nome,
          id: { not: id },
        },
      });

      if (existingConta) {
        throw new ConflictException(
          'Já existe uma conta com este nome neste grupo',
        );
      }
    }

    return this.prisma.contaDRE.update({
      where: { id },
      data: updateContaDreDto,
      include: {
        grupo: true,
      },
    });
  }

  async remove(id: number, parceiroId: number): Promise<void> {
    // Verificar se a conta existe
    await this.findOne(id, parceiroId);

    // Verificar se a conta está em uso em despesas
    const despesasCount = await this.prisma.despesa.count({
      where: { contaDreId: id },
    });
    if (despesasCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta conta. Ela está vinculada a ${despesasCount} despesa(s).`,
      );
    }

    // Verificar se a conta está em uso em despesas recorrentes
    const despesasRecorrentesCount = await this.prisma.despesaRecorrente.count({
      where: { contaDreId: id },
    });
    if (despesasRecorrentesCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta conta. Ela está vinculada a ${despesasRecorrentesCount} despesa(s) recorrente(s).`,
      );
    }

    // Verificar se a conta está em uso em regras de lançamento
    const regrasCount = await this.prisma.regraLancamentoAutomatico.count({
      where: { contaDreId: id },
    });
    if (regrasCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta conta. Ela está vinculada a ${regrasCount} regra(s) de lançamento automático.`,
      );
    }

    // Verificar se a conta está em uso em lançamentos DRE
    const lancamentosCount = await this.prisma.lancamentoDRE.count({
      where: { contaDreId: id },
    });
    if (lancamentosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta conta. Ela possui ${lancamentosCount} lançamento(s) no DRE.`,
      );
    }

    // Verificar se a conta está em uso em formas de pagamento
    const formasPagamentoCount = await this.prisma.formaPagamento.count({
      where: { contaDreId: id },
    });
    if (formasPagamentoCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta conta. Ela está vinculada a ${formasPagamentoCount} forma(s) de pagamento.`,
      );
    }

    // Hard delete - a conta não está em uso, pode ser excluída
    await this.prisma.contaDRE.delete({
      where: { id },
    });
  }
}
