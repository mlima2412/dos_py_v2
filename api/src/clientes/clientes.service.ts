import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(createClienteDto: CreateClienteDto): Promise<any> {
    // Verificar se email já existe
    if (createClienteDto.email) {
      await this.validateUniqueEmail(createClienteDto.email);
    }

    // Criar entidade e validar regras de negócio
    const clienteEntity = Cliente.create(createClienteDto);

    const cliente = await this.prisma.cliente.create({
      data: {
        id: clienteEntity.id,
        publicId: clienteEntity.publicId,
        nome: clienteEntity.nome,
        email: clienteEntity.email || null,
        redeSocial: clienteEntity.redeSocial || null,
        celular: clienteEntity.celular || null,
        ruccnpj: clienteEntity.ruccnpj || null,
        endereco: clienteEntity.endereco || null,
        cidade: clienteEntity.cidade || null,
        cep: clienteEntity.cep || null,
        observacoes: clienteEntity.observacoes || null,
        linguagem: clienteEntity.linguagem as any,
        ativo: clienteEntity.ativo,
        parceiroId: clienteEntity.parceiroId,
        canalOrigemId: clienteEntity.canalOrigemId || null,
        createdAt: clienteEntity.createdAt,
        updatedAt: clienteEntity.updatedAt,
        ultimaCompra: clienteEntity.ultimaCompra,
      },
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
    });

    return cliente;
  }

  async findAll(): Promise<any[]> {
    const clientes = await this.prisma.cliente.findMany({
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clientes;
  }

  async findOne(publicId: string): Promise<any> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { publicId },
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${publicId} não encontrado`);
    }

    return cliente;
  }

  async update(
    publicId: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<any> {
    const existingCliente = await this.findOne(publicId);

    // Verificar se email já existe (se está sendo alterado)
    if (
      updateClienteDto.email &&
      updateClienteDto.email !== existingCliente.email
    ) {
      await this.validateUniqueEmail(updateClienteDto.email);
    }

    // Criar entidade com dados atualizados para validar
    const updatedData = { ...existingCliente, ...updateClienteDto };
    const clienteEntity = new Cliente(updatedData);
    clienteEntity.validateBusinessRules();

    // Clean undefined values and convert to null for optional fields
    const cleanedData = {
      ...updateClienteDto,
      email: updateClienteDto.email || null,
      redeSocial: updateClienteDto.redeSocial || null,
      celular: updateClienteDto.celular || null,
      ruccnpj: updateClienteDto.ruccnpj || null,
      endereco: updateClienteDto.endereco || null,
      cidade: updateClienteDto.cidade || null,
      cep: updateClienteDto.cep || null,
      observacoes: updateClienteDto.observacoes || null,
      canalOrigemId: updateClienteDto.canalOrigemId || null,
    };

    const cliente = await this.prisma.cliente.update({
      where: { publicId },
      data: cleanedData,
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
    });

    return cliente;
  }

  async activate(publicId: string): Promise<any> {
    const existingCliente = await this.findOne(publicId);
    const clienteEntity = new Cliente(existingCliente);
    clienteEntity.activate();

    return this.update(publicId, { ativo: clienteEntity.ativo });
  }

  async deactivate(publicId: string): Promise<any> {
    const existingCliente = await this.findOne(publicId);
    const clienteEntity = new Cliente(existingCliente);
    clienteEntity.deactivate();

    return this.update(publicId, { ativo: clienteEntity.ativo });
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existingCliente = await this.prisma.cliente.findFirst({
      where: { email },
    });

    if (existingCliente) {
      throw new ConflictException('Email já está em uso por outro cliente');
    }
  }

  async findByParceiro(parceiroId: number): Promise<any[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { parceiroId },
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clientes;
  }

  async findByCanalOrigem(canalOrigemId: number): Promise<any[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { canalOrigemId },
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clientes;
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    parceiroId: number;
    canalOrigemId?: number;
    ativo?: boolean;
  }) {
    const { page, limit, search, parceiroId, canalOrigemId, ativo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro obrigatório por parceiro
    andConditions.push({ parceiroId });

    // Filtro de busca (nome ou email)
    if (search) {
      andConditions.push({
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Filtro por canal de origem
    if (canalOrigemId) {
      andConditions.push({ canalOrigemId });
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      andConditions.push({ ativo });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados paginados
    const [clientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        include: {
          Parceiro: true,
          CanalOrigem: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.cliente.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: clientes,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
