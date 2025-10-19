import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HttpCode, HttpStatus } from '@nestjs/common';
import { VendaItemService } from './venda-item.service';
import { CreateVendaItemDto } from './dto/create-venda-item.dto';
import { UpdateVendaItemDto } from './dto/update-venda-item.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { VendaItemEntity } from './entities/venda-item.entity';

@ApiTags('Venda Item')
@Controller('venda-item')
export class VendaItemController {
  constructor(private readonly vendaItemService: VendaItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Criar item de venda' })
  @ApiResponse({
    status: 201,
    description: 'Item criado com sucesso',
    type: VendaItemEntity,
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  create(
    @Body() createVendaItemDto: CreateVendaItemDto,
    @ParceiroId() parceiroId: number,
  ): Promise<VendaItemEntity> {
    return this.vendaItemService.create(createVendaItemDto, parceiroId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Listar itens de uma venda específica' })
  @ApiQuery({ name: 'vendaId', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens',
    type: [VendaItemEntity],
  })
  findAll(
    @Query('vendaId') vendaId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<VendaItemEntity[]> {
    return this.vendaItemService.findAll(Number(vendaId), parceiroId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Buscar item de venda por ID (requer vendaId)' })
  @ApiParam({ name: 'id', description: 'ID do item' })
  @ApiQuery({ name: 'vendaId', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Item encontrado',
    type: VendaItemEntity,
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  findOne(
    @Param('id') id: string,
    @Query('vendaId') vendaId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<VendaItemEntity> {
    return this.vendaItemService.findOne(
      Number(id),
      Number(vendaId),
      parceiroId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Atualizar item de venda (requer vendaId)' })
  @ApiParam({ name: 'id', description: 'ID do item' })
  @ApiQuery({ name: 'vendaId', required: true, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Item atualizado',
    type: VendaItemEntity,
  })
  update(
    @Param('id') id: string,
    @Query('vendaId') vendaId: string,
    @Body() updateVendaItemDto: UpdateVendaItemDto,
    @ParceiroId() parceiroId: number,
  ): Promise<VendaItemEntity> {
    return this.vendaItemService.update(
      Number(id),
      Number(vendaId),
      updateVendaItemDto,
      parceiroId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({
    summary: 'Remover item de venda (apenas se venda estiver PEDIDO)',
  })
  @ApiParam({ name: 'id', description: 'ID do item' })
  @ApiQuery({ name: 'vendaId', required: true, example: 1 })
  @ApiResponse({ status: 204, description: 'Item removido com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Exclusão permitida apenas com status PEDIDO',
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Query('vendaId') vendaId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.vendaItemService.remove(
      Number(id),
      Number(vendaId),
      parceiroId,
    );
  }
}
