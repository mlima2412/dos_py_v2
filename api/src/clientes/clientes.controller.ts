import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
  ApiHeader,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: Cliente,
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
  @ApiQuery({
    name: 'parceiroId',
    required: false,
    description: 'Filtrar por ID do parceiro',
  })
  @ApiQuery({
    name: 'canalOrigemId',
    required: false,
    description: 'Filtrar por ID do canal de origem',
  })
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
      return this.clientesService.findByParceiro(parseInt(parceiroId, 10));
    }
    if (canalOrigemId) {
      return this.clientesService.findByCanalOrigem(
        parseInt(canalOrigemId, 10),
      );
    }
    return this.clientesService.findAll();
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar clientes paginados' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de clientes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Cliente' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  async findPaginated(
    @Query() query: PaginatedQueryDto,
    @ParceiroId() parceiroId: number,
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '20', 10);
    const canalOrigemIdNum =
      query.canalOrigemId && query.canalOrigemId.trim() !== ''
        ? parseInt(query.canalOrigemId, 10)
        : undefined;
    const ativoBoolean =
      query.ativo && query.ativo.trim() !== ''
        ? query.ativo === 'true'
        : undefined;
    const searchTerm =
      query.search && query.search.trim() !== '' ? query.search : undefined;

    return this.clientesService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search: searchTerm,
      parceiroId,
      canalOrigemId: canalOrigemIdNum,
      ativo: ativoBoolean,
    });
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
    return this.clientesService.findByParceiro(parseInt(parceiroId, 10));
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
  findByCanalOrigem(
    @Param('canalOrigemId') canalOrigemId: string,
  ): Promise<Cliente[]> {
    return this.clientesService.findByCanalOrigem(parseInt(canalOrigemId, 10));
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
}
