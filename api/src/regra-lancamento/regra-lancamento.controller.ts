import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { RegraLancamentoService } from './regra-lancamento.service';
import { CreateRegraLancamentoDto } from './dto/create-regra-lancamento.dto';
import { UpdateRegraLancamentoDto } from './dto/update-regra-lancamento.dto';
import { RegraLancamentoAutomatico } from './entities/regra-lancamento.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('regra-lancamento')
@ApiBearerAuth('JWT-auth')
@Controller('regra-lancamento')
export class RegraLancamentoController {
  constructor(
    private readonly regraLancamentoService: RegraLancamentoService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova regra de lançamento automático' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({
    type: CreateRegraLancamentoDto,
    examples: {
      receitaVendas: {
        summary: 'Receita de Vendas',
        value: {
          contaDreId: 1,
          nome: 'Receita de Vendas',
          tipoGatilho: 'VENDA_CONFIRMADA',
          campoOrigem: 'valorTotal',
          ativo: true,
        },
      },
      ivaVendas: {
        summary: 'IVA sobre Vendas',
        value: {
          contaDreId: 2,
          impostoId: 1,
          nome: 'IVA sobre Vendas',
          tipoGatilho: 'VENDA_COM_FATURA',
          campoOrigem: 'valorTotal',
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Regra de lançamento criada com sucesso',
    type: RegraLancamentoAutomatico,
  })
  @ApiResponse({
    status: 404,
    description: 'Conta DRE ou Imposto não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma regra com este nome para este parceiro',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(
    @Body() createRegraLancamentoDto: CreateRegraLancamentoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    return this.regraLancamentoService.create(
      createRegraLancamentoDto,
      parceiroId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as regras de lançamento do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de regras de lançamento retornada com sucesso',
    type: [RegraLancamentoAutomatico],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(
    @ParceiroId() parceiroId: number,
  ): Promise<RegraLancamentoAutomatico[]> {
    return this.regraLancamentoService.findAll(parceiroId);
  }

  @Get('gatilho/:tipoGatilho')
  @ApiOperation({ summary: 'Listar regras por tipo de gatilho' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'tipoGatilho',
    description: 'Tipo de gatilho (VENDA_CONFIRMADA, VENDA_COM_FATURA)',
    type: 'string',
  })
  @ApiQuery({
    name: 'tipoVenda',
    description: 'Tipo de venda para filtrar',
    required: false,
    enum: ['DIRETA', 'CONDICIONAL', 'BRINDE', 'PERMUTA'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de regras retornada com sucesso',
    type: [RegraLancamentoAutomatico],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByTipoGatilho(
    @Param('tipoGatilho') tipoGatilho: string,
    @Query('tipoVenda') tipoVenda: string,
    @ParceiroId() parceiroId: number,
  ): Promise<RegraLancamentoAutomatico[]> {
    return this.regraLancamentoService.findByTipoGatilho(
      tipoGatilho,
      parceiroId,
      tipoVenda,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar regra de lançamento por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da regra de lançamento',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Regra de lançamento encontrada',
    type: RegraLancamentoAutomatico,
  })
  @ApiResponse({
    status: 404,
    description: 'Regra de lançamento não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    return this.regraLancamentoService.findOne(id, parceiroId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar regra de lançamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da regra de lançamento',
    type: 'number',
  })
  @ApiBody({
    type: UpdateRegraLancamentoDto,
    examples: {
      atualizarPercentual: {
        summary: 'Atualizar percentual',
        value: {
          percentual: 12.0,
        },
      },
      desativar: {
        summary: 'Desativar regra',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Regra de lançamento atualizada com sucesso',
    type: RegraLancamentoAutomatico,
  })
  @ApiResponse({
    status: 404,
    description: 'Regra de lançamento não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma regra com este nome para este parceiro',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegraLancamentoDto: UpdateRegraLancamentoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<RegraLancamentoAutomatico> {
    return this.regraLancamentoService.update(
      id,
      updateRegraLancamentoDto,
      parceiroId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover regra de lançamento (soft delete)' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da regra de lançamento',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Regra de lançamento removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra de lançamento não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.regraLancamentoService.remove(id, parceiroId);
  }
}
