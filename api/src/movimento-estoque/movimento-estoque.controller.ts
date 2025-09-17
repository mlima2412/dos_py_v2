import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MovimentoEstoqueService } from './movimento-estoque.service';
import { CreateMovimentoEstoqueDto, TipoMovimento } from './dto/create-movimento-estoque.dto';
import { MovimentoEstoqueResponseDto } from './dto/movimento-estoque-response.dto';
import { HistoricoSkuQueryDto } from './dto/historico-sku-query.dto';
import { AjusteEstoqueDto } from './dto/ajuste-estoque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Movimento de Estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('movimento-estoque')
export class MovimentoEstoqueController {
  constructor(private readonly movimentoEstoqueService: MovimentoEstoqueService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar movimento de estoque',
    description: 'Registra um novo movimento de estoque e atualiza automaticamente as quantidades',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimento criado com sucesso',
    type: MovimentoEstoqueResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'SKU ou local não encontrado',
  })
  async create(
    @Body() createMovimentoEstoqueDto: CreateMovimentoEstoqueDto,
    @Request() req: any,
  ): Promise<MovimentoEstoqueResponseDto> {
    const usuarioId = req.user.id;
    return this.movimentoEstoqueService.create(createMovimentoEstoqueDto, usuarioId);
  }

  @Post('ajuste')
  @ApiOperation({
    summary: 'Realizar ajuste de estoque',
    description: 'Endpoint específico para ajustes de estoque. Permite valores positivos (aumentar) ou negativos (diminuir) para corrigir divergências entre estoque físico e sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Ajuste realizado com sucesso',
    type: MovimentoEstoqueResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente para ajuste negativo',
  })
  @ApiResponse({
    status: 404,
    description: 'SKU ou local não encontrado',
  })
  async ajusteEstoque(
    @Body() ajusteEstoqueDto: AjusteEstoqueDto,
    @Request() req: any,
  ): Promise<MovimentoEstoqueResponseDto> {
    const usuarioId = req.user.id;
    
    // Converter AjusteEstoqueDto para CreateMovimentoEstoqueDto
    const createMovimentoDto: CreateMovimentoEstoqueDto = {
      skuId: ajusteEstoqueDto.skuId,
      tipo: TipoMovimento.AJUSTE,
      qtd: ajusteEstoqueDto.qtdAjuste,
      localDestinoId: ajusteEstoqueDto.localId,
      observacao: ajusteEstoqueDto.observacao,
    };

    return this.movimentoEstoqueService.create(createMovimentoDto, usuarioId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os movimentos',
    description: 'Retorna todos os movimentos de estoque ordenados por data (mais recentes primeiro)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimentos retornada com sucesso',
    type: [MovimentoEstoqueResponseDto],
  })
  async findAll(): Promise<MovimentoEstoqueResponseDto[]> {
    return this.movimentoEstoqueService.findAll();
  }

  @Get('historico-sku/:skuId')
  @ApiOperation({
    summary: 'Histórico de movimentos de um SKU',
    description: 'Retorna o histórico completo de movimentos de um SKU específico em ordem cronológica',
  })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página para paginação',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de itens por página',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico do SKU retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MovimentoEstoqueResponseDto' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'SKU não encontrado',
  })
  async findHistoricoSku(
    @Param('skuId') skuId: string,
    @Query() query: HistoricoSkuQueryDto,
  ) {
    return this.movimentoEstoqueService.findHistoricoSku(+skuId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar movimento por ID',
    description: 'Retorna um movimento de estoque específico pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do movimento',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Movimento encontrado com sucesso',
    type: MovimentoEstoqueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Movimento não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<MovimentoEstoqueResponseDto> {
    return this.movimentoEstoqueService.findOne(+id);
  }
}
