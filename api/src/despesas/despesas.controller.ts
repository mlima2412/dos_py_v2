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
  ApiExtraModels,
} from '@nestjs/swagger';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';
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
    schema: { type: 'integer', example: 1 }
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
    @ParceiroId() parceiroId: number
  ): Promise<Despesa> {
    console.log("Criando Despesa.....", createDespesaDto, parceiroId)
    return this.despesasService.create(createDespesaDto, parceiroId);
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar despesas com paginação, busca e filtros' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 }
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de despesas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Despesa' } },
        total: { type: 'number', description: 'Total de registros' },
        page: { type: 'number', description: 'Página atual' },
        limit: { type: 'number', description: 'Itens por página' },
        totalPages: { type: 'number', description: 'Total de páginas' }
      }
    }
  })
  findPaginated(
    @ParceiroId() parceiroId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('fornecedorId') fornecedorId?: string,
    @Query('subCategoriaId') subCategoriaId?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const fornecedorIdNum = fornecedorId ? parseInt(fornecedorId, 10) : undefined;
    const subCategoriaIdNum = subCategoriaId ? parseInt(subCategoriaId, 10) : undefined;
    
    return this.despesasService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search,
      parceiroId,
      fornecedorId: fornecedorIdNum,
      subCategoriaId: subCategoriaIdNum
    });
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as despesas do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 }
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas do parceiro',
    type: [Despesa],
  })
  async findAll(
    @ParceiroId() parceiroId: number,
    @Query('search') search?: string
  ): Promise<Despesa[]> {
    return this.despesasService.findByParceiro(parceiroId);
  }



  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar despesa por ID público' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 }
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
    @ParceiroId() parceiroId: number
  ): Promise<Despesa> {
    return this.despesasService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar despesa' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 }
  })
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
    @ParceiroId() parceiroId: number
  ): Promise<Despesa> {
    return this.despesasService.update(publicId, updateDespesaDto, parceiroId);
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover despesa' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 }
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
    @ParceiroId() parceiroId: number
  ): Promise<void> {
    return this.despesasService.remove(publicId, parceiroId);
  }
}