import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParceiroDto } from './dto/create-parceiro.dto';
import { UpdateParceiroDto } from './dto/update-parceiro.dto';
import { Parceiro } from './entities/parceiro.entity';

@Injectable()
export class ParceirosService {
  constructor(private prisma: PrismaService) {}

  async create(createParceiroDto: CreateParceiroDto): Promise<Parceiro> {
    // Verificar se o email já existe
    const existingParceiroByEmail = await this.prisma.parceiro.findUnique({
      where: { email: createParceiroDto.email },
    });

    if (existingParceiroByEmail) {
      throw new ConflictException('Email já está em uso');
    }

    // Verificar se o RUC/CNPJ já existe (se fornecido)
    if (createParceiroDto.ruccnpj) {
      const existingParceiroByRucCnpj = await this.prisma.parceiro.findUnique({
        where: { ruccnpj: createParceiroDto.ruccnpj },
      });

      if (existingParceiroByRucCnpj) {
        throw new ConflictException('RUC/CNPJ já está em uso');
      }
    }

    // Verificar se a moeda existe (se fornecida)
    if (createParceiroDto.currencyId) {
      const currency = await this.prisma.currency.findUnique({
        where: { id: createParceiroDto.currencyId },
      });
      if (!currency) {
        console.log("Moeda não encontrada", createParceiroDto.currencyId);
        throw new NotFoundException('Moeda não encontrada');
      }
    }

    // Criar instância da entidade com valores padrão
    const parceiroEntity = Parceiro.create(createParceiroDto);

    const parceiro = await this.prisma.parceiro.create({
      data: {
        publicId: parceiroEntity.publicId,
        nome: parceiroEntity.nome,
        ruccnpj: parceiroEntity.ruccnpj,
        email: parceiroEntity.email,
        redesocial: parceiroEntity.redesocial,
        telefone: parceiroEntity.telefone,
        currencyId: createParceiroDto.currencyId,
        ativo: parceiroEntity.ativo,
        logourl: parceiroEntity.logourl,
        thumburl: parceiroEntity.thumburl,
      },
    });

    return this.mapToParceiroEntity(parceiro);
  }

  private mapToParceiroEntity(data: any): Parceiro {
    return {
      id: data.id,
      publicId: data.publicId,
      nome: data.nome,
      ruccnpj: data.ruccnpj,
      email: data.email,
      redesocial: data.redesocial,
      telefone: data.telefone,
      currencyId: data.currencyId,
      ativo: data.ativo,
      logourl: data.logourl,
      thumburl: data.thumburl,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Parceiro;
  }

  async findAll(): Promise<Parceiro[]> {
    const parceiros = await this.prisma.parceiro.findMany({
      include: {
        currency: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return parceiros.map(p => this.mapToParceiroEntity(p));
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    ativo?: boolean;
  }) {
    const { page, limit, search, ativo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro de busca (nome, email)
    if (search) {
      andConditions.push({
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      andConditions.push({ ativo: ativo });
    }

    // Aplicar condições AND se houver filtros
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados com paginação
    const [parceiros, total] = await Promise.all([
      this.prisma.parceiro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          publicId: true,
          nome: true,
          ruccnpj: true,
          email: true,
          redesocial: true,
          telefone: true,
          currencyId: true,
          ativo: true,
          logourl: true,
          thumburl: true,
          createdAt: true,
        },
      }),
      this.prisma.parceiro.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: parceiros.map(p => this.mapToParceiroEntity(p)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(publicId: string): Promise<Parceiro> {
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { publicId },
      include: {
        currency: true,
      },
    });
    if (!parceiro) {
      throw new NotFoundException('Parceiro não encontrado');
    }
    return this.mapToParceiroEntity(parceiro);
  }

  async findByEmail(email: string): Promise<Parceiro | null> {
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { email },
    });
    return parceiro ? this.mapToParceiroEntity(parceiro) : null;
  }

  async findByRucCnpj(ruccnpj: string): Promise<Parceiro | null> {
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { ruccnpj },
    });
    return parceiro ? this.mapToParceiroEntity(parceiro) : null;
  }

  async update(
    publicId: string,
    updateParceiroDto: UpdateParceiroDto,
  ): Promise<Parceiro> {
    // Verificar se o parceiro existe
    console.log("atualizando parceiro moeda:", updateParceiroDto.currencyId, typeof updateParceiroDto.currencyId )
    await this.findOne(publicId);

    // Verificar conflitos de email (se fornecido e diferente do atual)
    if (updateParceiroDto.email) {
      const existingParceiro = await this.findByEmail(updateParceiroDto.email);
      if (existingParceiro && existingParceiro.publicId !== publicId) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Verificar conflitos de RUC/CNPJ (se fornecido e diferente do atual)
    if (updateParceiroDto.ruccnpj) {
      const existingParceiro = await this.findByRucCnpj(updateParceiroDto.ruccnpj);
      if (existingParceiro && existingParceiro.publicId !== publicId) {
        throw new ConflictException('RUC/CNPJ já está em uso');
      }
    }

    // Verificar se a moeda existe (se fornecida)
    if (updateParceiroDto.currencyId) {
      const currency = await this.prisma.currency.findUnique({
        where: { id: updateParceiroDto.currencyId },
      });
      if (!currency) {
        throw new NotFoundException('Moeda não encontrada');
      }
    }

    const parceiro = await this.prisma.parceiro.update({
      where: { publicId },
      data: updateParceiroDto,
    });

    return this.mapToParceiroEntity(parceiro);
  }

  async findActiveParceiros(): Promise<Parceiro[]> {
    const parceiros = await this.prisma.parceiro.findMany({
      where: { ativo: true },
      include: {
        currency: true,
      },
      orderBy: { nome: 'asc' },
    });
    return parceiros.map(p => this.mapToParceiroEntity(p));
  }

  async deactivateParceiro(publicId: string): Promise<Parceiro> {
    return this.updateStatus(publicId, false);
  }

  async activateParceiro(publicId: string): Promise<Parceiro> {
    return this.updateStatus(publicId, true);
  }

  private async updateStatus(publicId: string, ativo: boolean): Promise<Parceiro> {
    // Verificar se o parceiro existe
    await this.findOne(publicId);

    const parceiro = await this.prisma.parceiro.update({
      where: { publicId },
      data: { ativo },
    });

    return this.mapToParceiroEntity(parceiro);
  }
}