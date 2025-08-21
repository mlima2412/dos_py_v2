import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { Fornecedor } from './entities/fornecedor.entity';

@Injectable()
export class FornecedoresService {
  constructor(private prisma: PrismaService) {}

  async create(createFornecedorDto: CreateFornecedorDto): Promise<Fornecedor> {
    // Verificar se o email já existe (se fornecido)
    if (createFornecedorDto.email) {
      const existingFornecedorByEmail = await this.prisma.fornecedor.findUnique({
        where: { email: createFornecedorDto.email },
      });

      if (existingFornecedorByEmail) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Verificar se o RUC/CNPJ já existe (se fornecido)
    if (createFornecedorDto.ruccnpj) {
      const existingFornecedorByRucCnpj = await this.prisma.fornecedor.findUnique({
        where: { ruccnpj: createFornecedorDto.ruccnpj },
      });

      if (existingFornecedorByRucCnpj) {
        throw new ConflictException('RUC/CNPJ já está em uso');
      }
    }

    // Criar instância da entidade com valores padrão
    const fornecedorEntity = Fornecedor.create(createFornecedorDto);

    const fornecedor = await this.prisma.fornecedor.create({
      data: {
        publicId: fornecedorEntity.publicId,
        parceiroId: fornecedorEntity.parceiroId,
        nome: fornecedorEntity.nome,
        ruccnpj: fornecedorEntity.ruccnpj,
        email: fornecedorEntity.email,
        telefone: fornecedorEntity.telefone,
        redesocial: fornecedorEntity.redesocial,

        ativo: fornecedorEntity.ativo,
      },
    });

    return fornecedor as Fornecedor;
  }

  async findAll(id: number): Promise<Fornecedor[]> {
    const fornecedores = await this.prisma.fornecedor.findMany({
      where: { parceiroId: id },
      orderBy: { createdAt: 'desc' },
    });
    return fornecedores as Fornecedor[];
  }

  async findOne(publicId: string): Promise<Fornecedor> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { publicId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return fornecedor as Fornecedor;
  }

  async findByEmail(email: string): Promise<Fornecedor | null> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { email },
    });
    return fornecedor as Fornecedor | null;
  }

  async findByRucCnpj(ruccnpj: string): Promise<Fornecedor | null> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { ruccnpj },
    });
    return fornecedor as Fornecedor | null;
  }

  async update(
    publicId: string,
    updateFornecedorDto: UpdateFornecedorDto,
  ): Promise<Fornecedor> {
    // Verificar se o fornecedor existe
    const existingFornecedor = await this.findOne(publicId);

    // Se está tentando atualizar o email, verificar se não está em uso
    if (
      updateFornecedorDto.email &&
      updateFornecedorDto.email !== existingFornecedor.email
    ) {
      const emailInUse = await this.prisma.fornecedor.findUnique({
        where: { email: updateFornecedorDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Se está tentando atualizar o RUC/CNPJ, verificar se não está em uso
    if (
      updateFornecedorDto.ruccnpj &&
      updateFornecedorDto.ruccnpj !== existingFornecedor.ruccnpj
    ) {
      const rucCnpjInUse = await this.prisma.fornecedor.findUnique({
        where: { ruccnpj: updateFornecedorDto.ruccnpj },
      });

      if (rucCnpjInUse) {
        throw new ConflictException('RUC/CNPJ já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData = { ...updateFornecedorDto };

    const fornecedor = await this.prisma.fornecedor.update({
      where: { publicId },
      data: updateData,
    });

    return fornecedor as Fornecedor;
  }

  async findActiveFornecedores(): Promise<Fornecedor[]> {
    const fornecedores = await this.prisma.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
    });
    return fornecedores as Fornecedor[];
  }

  async deactivateFornecedor(publicId: string): Promise<Fornecedor> {
    return this.update(publicId, { ativo: false });
  }

  async activateFornecedor(publicId: string): Promise<Fornecedor> {
    return this.update(publicId, { ativo: true });
  }

  async updateUltimaCompra(publicId: string): Promise<Fornecedor> {
    const fornecedor = await this.prisma.fornecedor.update({
      where: { publicId },
      data: { ultimaCompra: new Date() },
    });

    return fornecedor as Fornecedor;
  }
}