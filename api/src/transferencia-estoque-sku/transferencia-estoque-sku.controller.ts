import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransferenciaEstoqueSkuService } from './transferencia-estoque-sku.service';
import { CreateTransferenciaEstoqueSkuDto } from './dto/create-transferencia-estoque-sku.dto';
import { UpdateTransferenciaEstoqueSkuDto } from './dto/update-transferencia-estoque-sku.dto';
import { TransferenciaEstoqueSkuResponseDto } from './dto/transferencia-estoque-sku-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transferência de Estoque - SKU')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transferencia-estoque-sku')
export class TransferenciaEstoqueSkuController {
  constructor(private readonly transferenciaEstoqueSkuService: TransferenciaEstoqueSkuService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar item de transferência de estoque',
    description: 'Cria um novo item de transferência de estoque, vinculando uma transferência a um movimento de estoque',
  })
  @ApiResponse({
    status: 201,
    description: 'Item de transferência criado com sucesso',
    type: TransferenciaEstoqueSkuResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência ou movimento de estoque não encontrado',
  })
  async create(@Body() createTransferenciaEstoqueSkuDto: CreateTransferenciaEstoqueSkuDto): Promise<TransferenciaEstoqueSkuResponseDto> {
    return this.transferenciaEstoqueSkuService.create(createTransferenciaEstoqueSkuDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os itens de transferência',
    description: 'Retorna todos os itens de transferência de estoque ordenados por ID (mais recentes primeiro)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens de transferência retornada com sucesso',
    type: [TransferenciaEstoqueSkuResponseDto],
  })
  async findAll(): Promise<TransferenciaEstoqueSkuResponseDto[]> {
    return this.transferenciaEstoqueSkuService.findAll();
  }

  @Get('transferencia/:transferenciaId')
  @ApiOperation({
    summary: 'Listar itens por transferência',
    description: 'Retorna todos os itens de uma transferência específica',
  })
  @ApiParam({
    name: 'transferenciaId',
    description: 'ID da transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens da transferência retornada com sucesso',
    type: [TransferenciaEstoqueSkuResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  async findByTransferencia(@Param('transferenciaId') transferenciaId: string): Promise<TransferenciaEstoqueSkuResponseDto[]> {
    return this.transferenciaEstoqueSkuService.findByTransferencia(+transferenciaId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar item de transferência por ID',
    description: 'Retorna um item de transferência específico pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do item de transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item de transferência encontrado com sucesso',
    type: TransferenciaEstoqueSkuResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de transferência não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<TransferenciaEstoqueSkuResponseDto> {
    return this.transferenciaEstoqueSkuService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar item de transferência',
    description: 'Atualiza um item de transferência de estoque existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do item de transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item de transferência atualizado com sucesso',
    type: TransferenciaEstoqueSkuResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item de transferência não encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransferenciaEstoqueSkuDto: UpdateTransferenciaEstoqueSkuDto,
  ): Promise<TransferenciaEstoqueSkuResponseDto> {
    return this.transferenciaEstoqueSkuService.update(+id, updateTransferenciaEstoqueSkuDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir item de transferência',
    description: 'Exclui um item de transferência de estoque',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do item de transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item de transferência excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Item de transferência não encontrado',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.transferenciaEstoqueSkuService.remove(+id);
    return { message: 'Item de transferência excluído com sucesso' };
  }
}
