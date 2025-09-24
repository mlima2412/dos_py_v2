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
import { PedidoCompraItemService } from './pedido-compra-item.service';
import { CreatePedidoCompraItemDto } from './dto/create-pedido-compra-item.dto';
import { UpdatePedidoCompraItemDto } from './dto/update-pedido-compra-item.dto';
import { PedidoCompraItem } from './entities/pedido-compra-item.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Itens de Pedidos de Compra')
@Controller('pedido-compra-item')
@UsePipes(new ValidationPipe({ transform: true }))
export class PedidoCompraItemController {
  constructor(private readonly pedidoCompraItemService: PedidoCompraItemService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Criar novo item de pedido de compra' })
  @ApiBody({
    type: CreatePedidoCompraItemDto,
    description: 'Dados para criação do item de pedido de compra',
  })
  @ApiResponse({
    status: 201,
    description: 'Item de pedido de compra criado com sucesso',
    type: PedidoCompraItem,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra ou SKU não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU já adicionado ao pedido ou pedido finalizado',
  })
  create(
    @Body() createPedidoCompraItemDto: CreatePedidoCompraItemDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompraItem> {
    return this.pedidoCompraItemService.create(createPedidoCompraItemDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Listar todos os itens de pedidos de compra do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens de pedidos de compra retornada com sucesso',
    type: [PedidoCompraItem],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<PedidoCompraItem[]> {
    return this.pedidoCompraItemService.findAll(parceiroId);
  }

  @Get('pedido/:pedidoCompraId')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Listar itens de um pedido de compra específico' })
  @ApiParam({
    name: 'pedidoCompraId',
    description: 'ID do pedido de compra',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens do pedido de compra retornada com sucesso',
    type: [PedidoCompraItem],
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido de compra não encontrado',
  })
  findByPedidoCompra(
    @Param('pedidoCompraId') pedidoCompraId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompraItem[]> {
    return this.pedidoCompraItemService.findByPedidoCompra(+pedidoCompraId, parceiroId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Buscar item de pedido de compra por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do item de pedido de compra',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item de pedido de compra encontrado com sucesso',
    type: PedidoCompraItem,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de pedido de compra não encontrado',
  })
  findOne(
    @Param('id') id: string,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompraItem> {
    return this.pedidoCompraItemService.findOne(+id, parceiroId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Atualizar dados do item de pedido de compra' })
  @ApiParam({
    name: 'id',
    description: 'ID do item de pedido de compra',
    example: 1,
  })
  @ApiBody({
    type: UpdatePedidoCompraItemDto,
    description: 'Dados para atualização do item de pedido de compra',
  })
  @ApiResponse({
    status: 200,
    description: 'Item de pedido de compra atualizado com sucesso',
    type: PedidoCompraItem,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU já existe no pedido ou pedido finalizado',
  })
  update(
    @Param('id') id: string,
    @Body() updatePedidoCompraItemDto: UpdatePedidoCompraItemDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PedidoCompraItem> {
    return this.pedidoCompraItemService.update(+id, updatePedidoCompraItemDto, parceiroId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    schema: { type: 'integer' },
  })
  @ApiOperation({ summary: 'Remover item de pedido de compra' })
  @ApiParam({
    name: 'id',
    description: 'ID do item de pedido de compra',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item de pedido de compra removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Item de pedido de compra não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Não é possível remover item de pedido finalizado',
  })
  remove(
    @Param('id') id: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.pedidoCompraItemService.remove(+id, parceiroId);
  }
}
