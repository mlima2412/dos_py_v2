import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
        publicId: clienteEntity.publicId,
        nome: clienteEntity.nome,
        sobrenome: clienteEntity.sobrenome,
        email: clienteEntity.email,
        telefone: clienteEntity.telefone,
        ruccnpj: clienteEntity.ruccnpj,
        endereco: clienteEntity.endereco,
        cidade: clienteEntity.cidade,
        cep: clienteEntity.cep,
        observacoes: clienteEntity.observacoes,
        linguagem: clienteEntity.linguagem as any,
        ativo: clienteEntity.ativo,
        parceiroId: clienteEntity.parceiroId,
        canalOrigemId: clienteEntity.canalOrigemId,
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

  async update(publicId: string, updateClienteDto: UpdateClienteDto): Promise<any> {
    const existingCliente = await this.findOne(publicId);

    // Verificar se email já existe (se está sendo alterado)
    if (updateClienteDto.email && updateClienteDto.email !== existingCliente.email) {
      await this.validateUniqueEmail(updateClienteDto.email);
    }

    // Criar entidade com dados atualizados para validar
    const updatedData = { ...existingCliente, ...updateClienteDto };
    const clienteEntity = new Cliente(updatedData);
    clienteEntity.validateBusinessRules();

    const cliente = await this.prisma.cliente.update({
      where: { publicId },
      data: updateClienteDto as any,
      include: {
        Parceiro: true,
        CanalOrigem: true,
      },
    });

    return cliente;
  }

  async remove(publicId: string): Promise<void> {
    // Cliente não pode ser removido, apenas desativado
    throw new BadRequestException('Clientes não podem ser removidos. Use a funcionalidade de desativar.');
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
}