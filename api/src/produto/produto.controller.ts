import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
} from '@nestjs/swagger';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { ProdutosPorLocalQueryDto } from './dto/produtos-por-local-query.dto';
import { ProdutosPorLocalResponseDto } from './dto/produtos-por-local-response.dto';

@ApiTags('Produtos')
@Controller('produto')
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateProdutoDto })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Nome do produto já está em uso nesta organização',
  })
  create(
    @Body() createProdutoDto: CreateProdutoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto> {
    return this.produtoService.create(createProdutoDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos',
    type: [Produto],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<Produto[]> {
    return this.produtoService.findAll(parceiroId);
  }

  @Get('categoria/:categoriaId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar produtos por categoria' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'categoriaId', description: 'ID da categoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos da categoria',
    type: [Produto],
  })
  findByCategoria(
    @Param('categoriaId') categoriaId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto[]> {
    return this.produtoService.findByCategoria(
      parseInt(categoriaId, 10),
      parceiroId,
    );
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar produtos paginados' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de produtos',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Produto' },
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
    const categoriaIdNum =
      query.categoriaId && query.categoriaId.trim() !== ''
        ? parseInt(query.categoriaId, 10)
        : undefined;
    const ativoBoolean =
      query.ativo && query.ativo.trim() !== ''
        ? query.ativo === 'true'
        : undefined;
    const searchTerm =
      query.search && query.search.trim() !== '' ? query.search : undefined;

    return this.produtoService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search: searchTerm,
      parceiroId,
      categoriaId: categoriaIdNum,
      ativo: ativoBoolean,
    });
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto> {
    return this.produtoService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do produto' })
  @ApiBody({ type: UpdateProdutoDto })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Nome do produto já está em uso nesta organização',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto> {
    return this.produtoService.update(publicId, updateProdutoDto, parceiroId);
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto ativado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  activate(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto> {
    return this.produtoService.activate(publicId, parceiroId);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto desativado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  deactivate(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Produto> {
    return this.produtoService.deactivate(publicId, parceiroId);
  }

  @Get('local/:localId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar produtos por local de estoque',
    description:
      'Lista todos os produtos que possuem SKUs com estoque em um local específico',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'localId',
    description: 'ID público do local de estoque',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos com estoque no local especificado',
    type: [ProdutosPorLocalResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Local de estoque não encontrado' })
  findByLocal(
    @Param('localId') localId: string,
    @Query() query: ProdutosPorLocalQueryDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutosPorLocalResponseDto[]> {
    return this.produtoService.findByLocal(
      localId,
      parceiroId,
      query.apenasComEstoque,
    );
  }
}
