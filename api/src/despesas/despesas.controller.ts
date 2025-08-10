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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
import { Despesa } from './entities/despesa.entity';

@ApiTags('Despesas')
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  @ApiBody({ type: CreateDespesaDto })
  @ApiResponse({
    status: 201,
    description: 'Despesa criada com sucesso',
    type: Despesa,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createDespesaDto: CreateDespesaDto): Promise<Despesa> {
    return this.despesasService.create(createDespesaDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as despesas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas',
    type: [Despesa],
  })
  async findAll(): Promise<Despesa[]> {
    return this.despesasService.findAll();
  }

  @Get('parceiro/:parceiroId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar despesas por parceiro (ordenadas por data decrescente)' })
  @ApiParam({
    name: 'parceiroId',
    description: 'ID do parceiro',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas do parceiro',
    type: [Despesa],
  })
  async findByParceiro(@Param('parceiroId', ParseIntPipe) parceiroId: number): Promise<Despesa[]> {
    return this.despesasService.findByParceiro(parceiroId);
  }

  @Get('fornecedor/:fornecedorId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar despesas por fornecedor' })
  @ApiParam({
    name: 'fornecedorId',
    description: 'ID do fornecedor',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas do fornecedor',
    type: [Despesa],
  })
  async findByFornecedor(@Param('fornecedorId', ParseIntPipe) fornecedorId: number): Promise<Despesa[]> {
    return this.despesasService.findByFornecedor(fornecedorId);
  }

  @Get('subcategoria/:subCategoriaId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar despesas por subcategoria' })
  @ApiParam({
    name: 'subCategoriaId',
    description: 'ID da subcategoria',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas da subcategoria',
    type: [Despesa],
  })
  async findBySubCategoria(@Param('subCategoriaId', ParseIntPipe) subCategoriaId: number): Promise<Despesa[]> {
    return this.despesasService.findBySubCategoria(subCategoriaId);
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar despesa por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da despesa',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da despesa',
    type: Despesa,
  })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  async findOne(@Param('publicId') publicId: string): Promise<Despesa> {
    return this.despesasService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar despesa' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da despesa',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiBody({ type: UpdateDespesaDto })
  @ApiResponse({
    status: 200,
    description: 'Despesa atualizada com sucesso',
    type: Despesa,
  })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('publicId') publicId: string,
    @Body() updateDespesaDto: UpdateDespesaDto,
  ): Promise<Despesa> {
    return this.despesasService.update(publicId, updateDespesaDto);
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover despesa' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da despesa',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 204,
    description: 'Despesa removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  async remove(@Param('publicId') publicId: string): Promise<void> {
    return this.despesasService.remove(publicId);
  }
}