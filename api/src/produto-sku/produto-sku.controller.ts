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
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ProdutoSkuService } from './produto-sku.service';
import { CreateProdutoSkuDto } from './dto/create-produto-sku.dto';
import { UpdateProdutoSkuDto } from './dto/update-produto-sku.dto';
import { ProdutoSKU } from './entities/produto-sku.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { PaginatedQueryDto } from './dto/paginated-query.dto';

@ApiTags('Produto SKU')
@Controller('produto-sku')
export class ProdutoSkuController {
  constructor(private readonly produtoSkuService: ProdutoSkuService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo SKU de produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateProdutoSkuDto })
  @ApiResponse({
    status: 201,
    description: 'SKU do produto criado com sucesso',
    type: ProdutoSKU,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  create(
    @Body() createProdutoSkuDto: CreateProdutoSkuDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoSKU> {
    return this.produtoSkuService.create(createProdutoSkuDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os SKUs de produtos' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de SKUs de produtos',
    type: [ProdutoSKU],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<ProdutoSKU[]> {
    return this.produtoSkuService.findAll(parceiroId);
  }

  @Get('produto/:produtoPublicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar SKUs de um produto específico' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'produtoPublicId', description: 'ID público do produto' })
  @ApiResponse({
    status: 200,
    description: 'Lista de SKUs do produto',
    type: [ProdutoSKU],
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findByProduto(
    @Param('produtoPublicId') produtoPublicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoSKU[]> {
    return this.produtoSkuService.findByProduto(produtoPublicId, parceiroId);
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar SKUs de produtos paginados' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de SKUs de produtos',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProdutoSKU' },
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
    const produtoIdNum =
      query.produtoId && query.produtoId.trim() !== ''
        ? parseInt(query.produtoId, 10)
        : undefined;
    const ativoBoolean =
      query.ativo && query.ativo.trim() !== ''
        ? query.ativo === 'true'
        : undefined;
    const searchTerm =
      query.search && query.search.trim() !== '' ? query.search : undefined;

    return this.produtoSkuService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search: searchTerm,
      parceiroId,
      produtoId: produtoIdNum,
      ativo: ativoBoolean,
    });
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar SKU de produto por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do SKU' })
  @ApiResponse({
    status: 200,
    description: 'SKU do produto encontrado',
    type: ProdutoSKU,
  })
  @ApiResponse({ status: 404, description: 'SKU do produto não encontrado' })
  findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoSKU> {
    return this.produtoSkuService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar SKU de produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do SKU' })
  @ApiBody({ type: UpdateProdutoSkuDto })
  @ApiResponse({
    status: 200,
    description: 'SKU do produto atualizado com sucesso',
    type: ProdutoSKU,
  })
  @ApiResponse({ status: 404, description: 'SKU do produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(
    @Param('publicId') publicId: string,
    @Body() updateProdutoSkuDto: UpdateProdutoSkuDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ProdutoSKU> {
    return this.produtoSkuService.update(publicId, updateProdutoSkuDto, parceiroId);
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover SKU de produto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'publicId', description: 'ID público do SKU' })
  @ApiResponse({
    status: 204,
    description: 'SKU do produto removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'SKU do produto não encontrado' })
  remove(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.produtoSkuService.remove(publicId, parceiroId);
  }

}
