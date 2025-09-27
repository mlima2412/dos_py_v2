import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { PedidoCompraService } from './pedido-compra.service';
import { CreatePedidoCompraDto } from './dto/create-pedido-compra.dto';
import { UpdatePedidoCompraDto } from './dto/update-pedido-compra.dto';
import { UpdateStatusPedidoCompraDto } from './dto/update-status-pedido-compra.dto';
import { ProcessaPedidoCompraDto } from './dto/processa-pedido-compra.dto';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { PedidoCompra } from './entities/pedido-compra.entity';
import { StatusPedidoCompra } from './enums/status-pedido-compra.enum';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pedidos de Compra')
@Controller('pedido-compra')
@UsePipes(new ValidationPipe({ transform: true }))
@UseGuards(JwtAuthGuard)
export class PedidoCompraController {
  constructor(private readonly pedidoCompraService: PedidoCompraService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Criar novo pedido de compra' })
  @ApiBody({
    type: CreatePedidoCompraDto,
    description: 'Dados para criação do pedido de compra',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido de compra criado com sucesso',
    type: PedidoCompra,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor ou local de estoque não encontrado',
  })
  create(
    @Body() createPedidoCompraDto: CreatePedidoCompraDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompra> {
    return this.pedidoCompraService.create(createPedidoCompraDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Listar todos os pedidos de compra do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos de compra retornada com sucesso',
    type: [PedidoCompra],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<PedidoCompra[]> {
    return this.pedidoCompraService.findAll(parceiroId);
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({
    summary: 'Listar pedidos de compra com paginação, busca e filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de pedidos de compra retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PedidoCompra' },
        },
        total: { type: 'number', description: 'Total de registros' },
        page: { type: 'number', description: 'Página atual' },
        limit: { type: 'number', description: 'Itens por página' },
        totalPages: { type: 'number', description: 'Total de páginas' },
      },
    },
  })
  async findPaginated(
    @Query() query: PaginatedQueryDto,
    @ParceiroId() parceiroId: number,
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '20', 10);
    const fornecedorIdNum =
      query.fornecedorId && query.fornecedorId.trim() !== ''
        ? parseInt(query.fornecedorId, 10)
        : undefined;
    const localEntradaIdNum =
      query.localEntradaId && query.localEntradaId.trim() !== ''
        ? parseInt(query.localEntradaId, 10)
        : undefined;
    const consignadoBoolean =
      query.consignado && query.consignado.trim() !== ''
        ? query.consignado === 'true'
        : undefined;
    const searchTerm =
      query.search && query.search.trim() !== '' ? query.search : undefined;
    const statusFilter =
      query.status && query.status.trim() !== '' ? query.status : undefined;

    return this.pedidoCompraService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search: searchTerm,
      parceiroId,
      fornecedorId: fornecedorIdNum,
      status: statusFilter,
      localEntradaId: localEntradaIdNum,
      consignado: consignadoBoolean,
    });
  }

  @Get('status/:status')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Listar pedidos de compra por status' })
  @ApiParam({
    name: 'status',
    description: 'Status do pedido de compra',
    enum: StatusPedidoCompra,
    example: StatusPedidoCompra.EDICAO,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos de compra por status retornada com sucesso',
    type: [PedidoCompra],
  })
  findByStatus(
    @Param('status') status: StatusPedidoCompra,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompra[]> {
    return this.pedidoCompraService.findByStatus(status, parceiroId);
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Buscar pedido de compra por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do pedido de compra (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido de compra encontrado com sucesso',
    type: PedidoCompra,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompra> {
    return this.pedidoCompraService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Atualizar dados do pedido de compra' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do pedido de compra (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiBody({
    type: UpdatePedidoCompraDto,
    description: 'Dados para atualização do pedido de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido de compra atualizado com sucesso',
    type: PedidoCompra,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Não é possível editar um pedido finalizado',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updatePedidoCompraDto: UpdatePedidoCompraDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompra> {
    return this.pedidoCompraService.update(
      publicId,
      updatePedidoCompraDto,
      parceiroId,
    );
  }

  @Patch(':publicId/status')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Atualizar status do pedido de compra' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do pedido de compra (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiBody({
    type: UpdateStatusPedidoCompraDto,
    description: 'Novo status do pedido de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do pedido de compra atualizado com sucesso',
    type: PedidoCompra,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Transição de status inválida',
  })
  updateStatus(
    @Param('publicId') publicId: string,
    @Body() updateStatusDto: UpdateStatusPedidoCompraDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompra> {
    return this.pedidoCompraService.updateStatus(
      publicId,
      updateStatusDto,
      parceiroId,
    );
  }

  @Post('processa-pedido-compra')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({
    summary:
      'Processar pedido de compra - gerar movimentação de estoque e despesas',
  })
  @ApiBody({
    type: ProcessaPedidoCompraDto,
    description: 'Dados para processamento do pedido de compra',
    examples: {
      a_prazo_sem_parcelas: {
        summary: 'À prazo sem parcelas',
        value: {
          publicId: '019985f6-584d-7341-b671-ab7e62aa3955',
          paymentType: 'A_PRAZO_SEM_PARCELAS',
          dueDate: '2025-10-17T03:00:00.000Z',
          entryValue: 0,
          installments: 1,
          firstInstallmentDate: null,
        },
      },
      a_vista_imediata: {
        summary: 'À vista imediata',
        value: {
          publicId: '019985f6-584d-7341-b671-ab7e62aa3955',
          paymentType: 'A_VISTA_IMEDIATA',
          dueDate: null,
          entryValue: 0,
          installments: 1,
          firstInstallmentDate: null,
        },
      },
      parcelado: {
        summary: 'Parcelado',
        value: {
          publicId: '019985f6-584d-7341-b671-ab7e62aa3955',
          paymentType: 'PARCELADO',
          dueDate: null,
          entryValue: 15343,
          installments: 3,
          firstInstallmentDate: '2025-10-29T03:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido de compra processado com sucesso',
    type: PedidoCompra,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou pedido já processado',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Pedido de compra já foi processado',
  })
  processaPedidoCompra(
    @Body() processaPedidoCompraDto: ProcessaPedidoCompraDto,
    @ParceiroId() parceiroId: number,
    @UserId() usuarioId: number,
  ): Promise<PedidoCompra> {
    return this.pedidoCompraService.processaPedidoCompra(
      processaPedidoCompraDto,
      parceiroId,
      usuarioId,
    );
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Remover pedido de compra' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do pedido de compra (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido de compra removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Não é possível remover um pedido finalizado',
  })
  remove(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.pedidoCompraService.remove(publicId, parceiroId);
  }
}
