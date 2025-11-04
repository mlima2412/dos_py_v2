import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { PaginatedDespesaResponseDto } from './dto/paginated-despesa-response.dto';
import { YearItemDto } from './dto/year-item-response.dto';

import { Despesa } from './entities/despesa.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Despesas')
@Controller('despesas')
export class DespesasController {
  constructor(private readonly despesasService: DespesasService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateDespesaDto })
  @ApiResponse({
    status: 201,
    description: 'Despesa criada com sucesso',
    type: Despesa,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() createDespesaDto: CreateDespesaDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Despesa> {
    return this.despesasService.create(createDespesaDto, parceiroId);
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar despesas paginadas' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de despesas',
    type: PaginatedDespesaResponseDto,
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
    const subCategoriaIdNum =
      query.subCategoriaId && query.subCategoriaId.trim() !== ''
        ? parseInt(query.subCategoriaId, 10)
        : undefined;
    const searchTerm =
      query.search && query.search.trim() !== '' ? query.search : undefined;

    return this.despesasService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search: searchTerm,
      parceiroId,
      fornecedorId: fornecedorIdNum,
      subCategoriaId: subCategoriaIdNum,
    });
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as despesas do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas do parceiro',
    type: [Despesa],
  })
  async findAll(@ParceiroId() parceiroId: number): Promise<Despesa[]> {
    return this.despesasService.findByParceiro(parceiroId);
  }

  @Get('DespesasAno')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lista todos os anos que tiveram despesas' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de anos com despesas',
    type: [YearItemDto],
  })
  async listYears(@ParceiroId() parceiroId: number): Promise<YearItemDto[]> {
    return this.despesasService.listYears(parceiroId);
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar despesa por ID público' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
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
  async findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Despesa> {
    return this.despesasService.findOne(publicId, parceiroId);
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover despesa' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
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
  async remove(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.despesasService.remove(publicId, parceiroId);
  }
}
