import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConferenciaEstoqueDto } from './dto/create-conferencia-estoque.dto';
import { UpdateConferenciaEstoqueDto } from './dto/update-conferencia-estoque.dto';
import { ConferenciaEstoque } from './entities/conferencia-estoque.entity';

@Injectable()
export class ConferenciaEstoqueService {
  constructor(private prisma: PrismaService) {}

  async create(
    createConferenciaEstoqueDto: CreateConferenciaEstoqueDto,
    parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    // Verificar se o local de estoque existe e pertence ao parceiro
    await this.validateLocalEstoque(
      createConferenciaEstoqueDto.localEstoqueId,
      parceiroId,
    );

    // Verificar se o usuário existe
    await this.validateUsuario(createConferenciaEstoqueDto.usuarioResponsavel);

    // Verificar se já existe uma conferência em andamento para este local
    await this.validateConferenciaEmAndamento(
      createConferenciaEstoqueDto.localEstoqueId,
    );

    // Criar entidade e validar regras de negócio
    const conferenciaEntity = ConferenciaEstoque.create({
      ...createConferenciaEstoqueDto,
      parceiroId,
      dataInicio: createConferenciaEstoqueDto.dataInicio
        ? new Date(createConferenciaEstoqueDto.dataInicio)
        : new Date(),
      dataFim: createConferenciaEstoqueDto.dataFim
        ? new Date(createConferenciaEstoqueDto.dataFim)
        : null,
    });

    const conferencia = await this.prisma.conferenciaEstoque.create({
      data: {
        publicId: conferenciaEntity.publicId,
        parceiroId: conferenciaEntity.parceiroId,
        localEstoqueId: conferenciaEntity.localEstoqueId,
        dataInicio: conferenciaEntity.dataInicio,
        dataFim: conferenciaEntity.dataFim,
        usuarioResponsavel: conferenciaEntity.usuarioResponsavel,
        status: conferenciaEntity.status,
      },
      include: {
        Usuario: {
          select: {
            nome: true,
          },
        },
        LocalEstoque: {
          select: {
            nome: true,
          },
        },
      },
    });

    return this.mapToConferenciaEntity(conferencia);
  }

  async findAll(parceiroId: number): Promise<ConferenciaEstoque[]> {
    const conferencias = await this.prisma.conferenciaEstoque.findMany({
      where: { parceiroId },
      include: {
        Usuario: {
          select: {
            nome: true,
          },
        },
        LocalEstoque: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { dataInicio: 'desc' },
    });

    return conferencias.map(conferencia =>
      this.mapToConferenciaEntity(conferencia),
    );
  }

  async findOne(
    publicId: string,
    parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    const conferencia = await this.prisma.conferenciaEstoque.findFirst({
      where: {
        publicId,
        parceiroId,
      },
      include: {
        Usuario: {
          select: {
            nome: true,
          },
        },
        LocalEstoque: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!conferencia) {
      throw new NotFoundException('Conferência de estoque não encontrada');
    }

    return this.mapToConferenciaEntity(conferencia);
  }

  async update(
    publicId: string,
    updateConferenciaEstoqueDto: UpdateConferenciaEstoqueDto,
    parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    // Verificar se a conferência existe
    const existingConferencia = await this.prisma.conferenciaEstoque.findFirst({
      where: {
        publicId,
        parceiroId,
      },
    });

    if (!existingConferencia) {
      throw new NotFoundException('Conferência de estoque não encontrada');
    }

    // Verificar se a conferência pode ser atualizada
    if (existingConferencia.status === 'FINALIZADA') {
      throw new BadRequestException(
        'Não é possível atualizar uma conferência finalizada',
      );
    }

    // Validações adicionais se necessário
    if (updateConferenciaEstoqueDto.localEstoqueId) {
      await this.validateLocalEstoque(
        updateConferenciaEstoqueDto.localEstoqueId,
        parceiroId,
      );
    }

    if (updateConferenciaEstoqueDto.usuarioResponsavel) {
      await this.validateUsuario(
        updateConferenciaEstoqueDto.usuarioResponsavel,
      );
    }

    const conferencia = await this.prisma.conferenciaEstoque.update({
      where: { id: existingConferencia.id },
      data: {
        ...updateConferenciaEstoqueDto,
        dataFim: updateConferenciaEstoqueDto.dataFim
          ? new Date(updateConferenciaEstoqueDto.dataFim)
          : undefined,
      },
      include: {
        Usuario: {
          select: {
            nome: true,
          },
        },
        LocalEstoque: {
          select: {
            nome: true,
          },
        },
      },
    });

    return this.mapToConferenciaEntity(conferencia);
  }

  async remove(publicId: string, parceiroId: number): Promise<void> {
    const conferencia = await this.prisma.conferenciaEstoque.findFirst({
      where: {
        publicId,
        parceiroId,
      },
    });

    if (!conferencia) {
      throw new NotFoundException('Conferência de estoque não encontrada');
    }

    // Verificar se a conferência pode ser removida
    if (conferencia.status === 'FINALIZADA') {
      throw new BadRequestException(
        'Não é possível remover uma conferência finalizada',
      );
    }

    await this.prisma.conferenciaEstoque.delete({
      where: { id: conferencia.id },
    });
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    status?: string;
    localEstoqueId?: number;
  }) {
    const { page, limit, search, parceiroId, status, localEstoqueId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      parceiroId,
    };

    if (status) {
      where.status = status;
    }

    if (localEstoqueId) {
      where.localEstoqueId = localEstoqueId;
    }

    if (search) {
      where.OR = [
        {
          LocalEstoque: {
            nome: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          Usuario: {
            nome: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [conferencias, total] = await Promise.all([
      this.prisma.conferenciaEstoque.findMany({
        where,
        include: {
          Usuario: {
            select: {
              nome: true,
            },
          },
          LocalEstoque: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: { dataInicio: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conferenciaEstoque.count({ where }),
    ]);

    return {
      data: conferencias.map(conferencia =>
        this.mapToConferenciaEntity(conferencia),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isLocalEstoqueEmConferencia(
    localEstoquePublicId: string,
    parceiroId: number,
  ): Promise<boolean> {
    // Primeiro, buscar o local de estoque pelo publicId
    const localEstoque = await this.prisma.localEstoque.findFirst({
      where: {
        publicId: localEstoquePublicId,
        parceiroId,
      },
    });

    if (!localEstoque) {
      throw new NotFoundException('Local de estoque não encontrado');
    }

    // Verificar se existe alguma conferência com status PENDENTE para este local
    const conferenciaEmAndamento =
      await this.prisma.conferenciaEstoque.findFirst({
        where: {
          localEstoqueId: localEstoque.id,
          status: {
            in: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'],
          },
        },
      });

    return !!conferenciaEmAndamento;
  }

  private async validateLocalEstoque(
    localEstoqueId: number,
    parceiroId: number,
  ): Promise<void> {
    const localEstoque = await this.prisma.localEstoque.findFirst({
      where: {
        id: localEstoqueId,
        parceiroId,
      },
    });

    if (!localEstoque) {
      throw new NotFoundException('Local de estoque não encontrado');
    }
  }

  private async validateUsuario(usuarioId: number): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  private async validateConferenciaEmAndamento(
    localEstoqueId: number,
  ): Promise<void> {
    const conferenciaEmAndamento =
      await this.prisma.conferenciaEstoque.findFirst({
        where: {
          localEstoqueId,
          status: {
            in: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'],
          },
        },
      });

    if (conferenciaEmAndamento) {
      throw new ConflictException(
        'Já existe uma conferência em andamento para este local de estoque',
      );
    }
  }

  private mapToConferenciaEntity(data: any): ConferenciaEstoque {
    return new ConferenciaEstoque({
      id: data.id,
      publicId: data.publicId,
      parceiroId: data.parceiroId,
      localEstoqueId: data.localEstoqueId,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      usuarioResponsavel: data.usuarioResponsavel,
      status: data.status,
      Usuario: data.Usuario?.nome,
      localNome: data.LocalEstoque?.nome,
    });
  }
}
