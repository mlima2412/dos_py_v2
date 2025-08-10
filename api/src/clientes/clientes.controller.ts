import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiBody({
    type: CreateClienteDto,
    examples: {
      pessoaFisica: {
        summary: 'Cliente Pessoa Física',
        description: 'Exemplo de criação de cliente pessoa física',
        value: {
          nome: 'João Silva',
          email: 'joao.silva@email.com',
          telefone: '(11) 99999-9999',
          cpfCnpj: '123.456.789-00',
          endereco: 'Rua das Flores, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          parceiroId: 1,
          canalOrigemId: 1
        }
      },
      pessoaJuridica: {
        summary: 'Cliente Pessoa Jurídica',
        description: 'Exemplo de criação de cliente pessoa jurídica',
        value: {
          nome: 'Empresa ABC Ltda',
          email: 'contato@empresaabc.com',
          telefone: '(11) 3333-4444',
          cpfCnpj: '12.345.678/0001-90',
          endereco: 'Av. Paulista, 1000',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310-100',
          parceiroId: 2,
          canalOrigemId: 2
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: Cliente,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiQuery({ name: 'parceiroId', required: false, description: 'Filtrar por ID do parceiro' })
  @ApiQuery({ name: 'canalOrigemId', required: false, description: 'Filtrar por ID do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    type: [Cliente],
  })
  findAll(
    @Query('parceiroId') parceiroId?: string,
    @Query('canalOrigemId') canalOrigemId?: string,
  ): Promise<Cliente[]> {
    if (parceiroId) {
      return this.clientesService.findByParceiro(parseInt(parceiroId));
    }
    if (canalOrigemId) {
      return this.clientesService.findByCanalOrigem(parseInt(canalOrigemId));
    }
    return this.clientesService.findAll();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({ name: 'publicId', description: 'ID público do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: Cliente,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  findOne(@Param('publicId') publicId: string): Promise<Cliente> {
    return this.clientesService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiParam({ name: 'publicId', description: 'ID público do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
    type: Cliente,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  update(
    @Param('publicId') publicId: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    return this.clientesService.update(publicId, updateClienteDto);
  }

  // Endpoint de exclusão removido - clientes não podem ser excluídos, apenas desativados

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar cliente' })
  @ApiParam({ name: 'publicId', description: 'ID público do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente ativado com sucesso',
    type: Cliente,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  activate(@Param('publicId') publicId: string): Promise<Cliente> {
    return this.clientesService.activate(publicId);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desativar cliente' })
  @ApiParam({ name: 'publicId', description: 'ID público do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente desativado com sucesso',
    type: Cliente,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  deactivate(@Param('publicId') publicId: string): Promise<Cliente> {
    return this.clientesService.deactivate(publicId);
  }

  @Get('parceiro/:parceiroId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar clientes por parceiro' })
  @ApiParam({ name: 'parceiroId', description: 'ID do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes do parceiro',
    type: [Cliente],
  })
  findByParceiro(@Param('parceiroId') parceiroId: string): Promise<Cliente[]> {
    return this.clientesService.findByParceiro(parseInt(parceiroId));
  }

  @Get('canal-origem/:canalOrigemId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar clientes por canal de origem' })
  @ApiParam({ name: 'canalOrigemId', description: 'ID do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes do canal de origem',
    type: [Cliente],
  })
  findByCanalOrigem(@Param('canalOrigemId') canalOrigemId: string): Promise<Cliente[]> {
    return this.clientesService.findByCanalOrigem(parseInt(canalOrigemId));
  }
}