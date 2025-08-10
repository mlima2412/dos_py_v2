import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { DespesasRecorrentesService } from './despesas-recorrentes.service';
import { CreateDespesaRecorrenteDto } from './dto/create-despesa-recorrente.dto';
import { UpdateDespesaRecorrenteDto } from './dto/update-despesa-recorrente.dto';
import { DespesaRecorrente } from './entities/despesa-recorrente.entity';

@ApiTags('Despesas Recorrentes')
@Controller('despesas-recorrentes')
@ApiBearerAuth()
export class DespesasRecorrentesController {
  constructor(private readonly despesasRecorrentesService: DespesasRecorrentesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova despesa recorrente' })
  @ApiBody({ type: CreateDespesaRecorrenteDto })
  @ApiResponse({
    status: 201,
    description: 'Despesa recorrente criada com sucesso',
    type: DespesaRecorrente,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createDespesaRecorrenteDto: CreateDespesaRecorrenteDto): Promise<DespesaRecorrente> {
    return this.despesasRecorrentesService.create(createDespesaRecorrenteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as despesas recorrentes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas recorrentes',
    type: [DespesaRecorrente],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(): Promise<DespesaRecorrente[]> {
    return this.despesasRecorrentesService.findAll();
  }

  @Get('parceiro/:parceiroId')
  @ApiOperation({ summary: 'Buscar despesas recorrentes por parceiro' })
  @ApiParam({ name: 'parceiroId', description: 'ID do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas recorrentes do parceiro',
    type: [DespesaRecorrente],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByParceiro(@Param('parceiroId', ParseIntPipe) parceiroId: number): Promise<DespesaRecorrente[]> {
    return this.despesasRecorrentesService.findByParceiro(parceiroId);
  }

  @Get('fornecedor/:fornecedorId')
  @ApiOperation({ summary: 'Buscar despesas recorrentes por fornecedor' })
  @ApiParam({ name: 'fornecedorId', description: 'ID do fornecedor' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas recorrentes do fornecedor',
    type: [DespesaRecorrente],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByFornecedor(@Param('fornecedorId', ParseIntPipe) fornecedorId: number): Promise<DespesaRecorrente[]> {
    return this.despesasRecorrentesService.findByFornecedor(fornecedorId);
  }

  @Get('subcategoria/:subCategoriaId')
  @ApiOperation({ summary: 'Buscar despesas recorrentes por subcategoria' })
  @ApiParam({ name: 'subCategoriaId', description: 'ID da subcategoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas recorrentes da subcategoria',
    type: [DespesaRecorrente],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findBySubCategoria(@Param('subCategoriaId', ParseIntPipe) subCategoriaId: number): Promise<DespesaRecorrente[]> {
    return this.despesasRecorrentesService.findBySubCategoria(subCategoriaId);
  }

  @Get('frequencia/:frequencia')
  @ApiOperation({ summary: 'Buscar despesas recorrentes por frequência' })
  @ApiParam({ name: 'frequencia', description: 'Frequência da despesa recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas recorrentes da frequência',
    type: [DespesaRecorrente],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByFrequencia(@Param('frequencia') frequencia: string): Promise<DespesaRecorrente[]> {
    return this.despesasRecorrentesService.findByFrequencia(frequencia);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Buscar despesa recorrente por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID público da despesa recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Despesa recorrente encontrada',
    type: DespesaRecorrente,
  })
  @ApiResponse({ status: 404, description: 'Despesa recorrente não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('publicId') publicId: string): Promise<DespesaRecorrente> {
    return this.despesasRecorrentesService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Atualizar despesa recorrente' })
  @ApiParam({ name: 'publicId', description: 'ID público da despesa recorrente' })
  @ApiBody({ type: UpdateDespesaRecorrenteDto })
  @ApiResponse({
    status: 200,
    description: 'Despesa recorrente atualizada com sucesso',
    type: DespesaRecorrente,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Despesa recorrente não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('publicId') publicId: string,
    @Body() updateDespesaRecorrenteDto: UpdateDespesaRecorrenteDto,
  ): Promise<DespesaRecorrente> {
    return this.despesasRecorrentesService.update(publicId, updateDespesaRecorrenteDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Remover despesa recorrente' })
  @ApiParam({ name: 'publicId', description: 'ID público da despesa recorrente' })
  @ApiResponse({ status: 200, description: 'Despesa recorrente removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Despesa recorrente não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('publicId') publicId: string): Promise<void> {
    return this.despesasRecorrentesService.remove(publicId);
  }
}