import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { ProdutoHistoricoPrecoService } from './produto-historico-preco.service';
import { CreateProdutoHistoricoPrecoDto } from './dto/create-produto-historico-preco.dto';
import { ProdutoHistoricoPreco } from './entities/produto-historico-preco.entity';
import { ProdutoHistoricoPrecoResponseDto } from './dto/produto-historico-preco-response.dto';
import { HistoricoPrecoQueryDto } from './dto/historico-preco-query.dto';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Produto Histórico Preço')
@Controller('produto-historico-preco')
export class ProdutoHistoricoPrecoController {
  constructor(private readonly produtoHistoricoPrecoService: ProdutoHistoricoPrecoService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar novo registro de histórico de preço',
    description: 'Registra um novo preço para um produto no histórico'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateProdutoHistoricoPrecoDto })
  @ApiResponse({
    status: 201,
    description: 'Histórico de preço criado com sucesso',
    type: ProdutoHistoricoPreco,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  create(
    @Body() createProdutoHistoricoPrecoDto: CreateProdutoHistoricoPrecoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoHistoricoPreco> {
    return this.produtoHistoricoPrecoService.create(createProdutoHistoricoPrecoDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar todos os históricos de preço',
    description: 'Lista todos os registros de histórico de preço dos produtos do parceiro com filtros opcionais'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiQuery({
    name: 'dataInicial',
    description: 'Data inicial para filtro (formato ISO)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dataFinal',
    description: 'Data final para filtro (formato ISO)',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de registros (máximo 100)',
    required: false,
    example: 50,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de históricos de preço',
    type: [ProdutoHistoricoPrecoResponseDto],
  })
  findAll(
    @ParceiroId() parceiroId: number,
    @Query() query: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    return this.produtoHistoricoPrecoService.findAll(parceiroId, query);
  }

  @Get('produto/:produtoId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar histórico de preços por ID do produto',
    description: 'Lista todos os registros de histórico de preço de um produto específico pelo ID numérico com filtros opcionais'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ 
    name: 'produtoId', 
    description: 'ID numérico do produto',
    example: 1,
    type: 'integer'
  })
  @ApiQuery({
    name: 'dataInicial',
    description: 'Data inicial para filtro (formato ISO)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dataFinal',
    description: 'Data final para filtro (formato ISO)',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de registros (máximo 100)',
    required: false,
    example: 50,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de históricos de preço do produto',
    type: [ProdutoHistoricoPrecoResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findByProdutoId(
    @Param('produtoId') produtoId: string,
    @ParceiroId() parceiroId: number,
    @Query() query: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    return this.produtoHistoricoPrecoService.findByProdutoId(+produtoId, parceiroId, query);
  }

  @Get('produto/public/:produtoPublicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar histórico de preços por Public ID do produto',
    description: 'Lista todos os registros de histórico de preço de um produto específico pelo Public ID com filtros opcionais'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ 
    name: 'produtoPublicId', 
    description: 'Public ID do produto',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @ApiQuery({
    name: 'dataInicial',
    description: 'Data inicial para filtro (formato ISO)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dataFinal',
    description: 'Data final para filtro (formato ISO)',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de registros (máximo 100)',
    required: false,
    example: 50,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de históricos de preço do produto',
    type: [ProdutoHistoricoPrecoResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findByProdutoPublicId(
    @Param('produtoPublicId') produtoPublicId: string,
    @ParceiroId() parceiroId: number,
    @Query() query: HistoricoPrecoQueryDto,
  ): Promise<ProdutoHistoricoPrecoResponseDto[]> {
    return this.produtoHistoricoPrecoService.findByProdutoPublicId(produtoPublicId, parceiroId, query);
  }

  @Get('produto/:produtoId/latest')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Buscar último preço registrado do produto',
    description: 'Retorna o último registro de preço de um produto específico'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ 
    name: 'produtoId', 
    description: 'ID numérico do produto',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Último preço registrado do produto',
    type: ProdutoHistoricoPrecoResponseDto,
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Nenhum histórico de preço encontrado para o produto' 
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getLatestPrice(
    @Param('produtoId') produtoId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoHistoricoPrecoResponseDto | null> {
    const result = await this.produtoHistoricoPrecoService.getLatestPriceByProdutoId(+produtoId, parceiroId);
    return result;
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Buscar histórico de preço por ID',
    description: 'Busca um registro específico de histórico de preço pelo ID'
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID do histórico de preço',
    example: 1,
    type: 'integer'
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de preço encontrado',
    type: ProdutoHistoricoPreco,
  })
  @ApiResponse({ status: 404, description: 'Histórico de preço não encontrado' })
  findOne(
    @Param('id') id: string,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoHistoricoPreco> {
    return this.produtoHistoricoPrecoService.findOne(+id, parceiroId);
  }
}
