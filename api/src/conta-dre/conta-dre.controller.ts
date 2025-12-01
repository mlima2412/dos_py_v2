import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ContaDreService } from './conta-dre.service';
import { CreateContaDreDto } from './dto/create-conta-dre.dto';
import { UpdateContaDreDto } from './dto/update-conta-dre.dto';
import { ContaDRE } from './entities/conta-dre.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { TipoDRE } from '@prisma/client';

@ApiTags('conta-dre')
@ApiBearerAuth('JWT-auth')
@Controller('conta-dre')
export class ContaDreController {
  constructor(private readonly contaDreService: ContaDreService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta DRE' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({
    type: CreateContaDreDto,
    examples: {
      vendaProdutos: {
        summary: 'Venda de Produtos',
        value: {
          grupoId: 1,
          codigo: '1001',
          nome: 'Venda de Produtos',
          ordem: 1,
          ativo: true,
        },
      },
      iva: {
        summary: 'IVA sobre Vendas',
        value: {
          grupoId: 2,
          codigo: '2001',
          nome: 'IVA sobre Vendas',
          ordem: 1,
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Conta DRE criada com sucesso',
    type: ContaDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo DRE não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma conta com este nome neste grupo',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(
    @Body() createContaDreDto: CreateContaDreDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ContaDRE> {
    return this.contaDreService.create(createContaDreDto, parceiroId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as contas DRE do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas DRE retornada com sucesso',
    type: [ContaDRE],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@ParceiroId() parceiroId: number): Promise<ContaDRE[]> {
    return this.contaDreService.findAll(parceiroId);
  }

  @Get('grupo/:grupoId')
  @ApiOperation({ summary: 'Listar contas DRE por grupo' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'grupoId',
    description: 'ID do grupo DRE',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas DRE do grupo retornada com sucesso',
    type: [ContaDRE],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByGrupo(
    @Param('grupoId', ParseIntPipe) grupoId: number,
    @ParceiroId() parceiroId: number,
  ): Promise<ContaDRE[]> {
    return this.contaDreService.findByGrupo(grupoId, parceiroId);
  }

  @Get('tipo/:tipoGrupo')
  @ApiOperation({
    summary: 'Listar contas DRE por tipo de grupo',
    description:
      'Retorna contas filtrando pelo tipo do grupo (RECEITA, DEDUCAO, CUSTO, DESPESA)',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'tipoGrupo',
    description: 'Tipo do grupo DRE (RECEITA, DEDUCAO, CUSTO, DESPESA)',
    type: 'string',
    enum: ['RECEITA', 'DEDUCAO', 'CUSTO', 'DESPESA'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas DRE retornada com sucesso',
    type: [ContaDRE],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByGrupoTipo(
    @Param('tipoGrupo', new ParseEnumPipe(TipoDRE)) tipoGrupo: TipoDRE,
    @ParceiroId() parceiroId: number,
  ): Promise<ContaDRE[]> {
    return this.contaDreService.findByGrupoTipo(tipoGrupo, parceiroId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta DRE por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta DRE',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta DRE encontrada',
    type: ContaDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Conta DRE não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<ContaDRE> {
    return this.contaDreService.findOne(id, parceiroId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta DRE' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta DRE',
    type: 'number',
  })
  @ApiBody({
    type: UpdateContaDreDto,
    examples: {
      atualizarNome: {
        summary: 'Atualizar nome',
        value: {
          nome: 'Venda de Mercadorias',
        },
      },
      desativar: {
        summary: 'Desativar conta',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Conta DRE atualizada com sucesso',
    type: ContaDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Conta DRE não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma conta com este nome neste grupo',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContaDreDto: UpdateContaDreDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ContaDRE> {
    return this.contaDreService.update(id, updateContaDreDto, parceiroId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta DRE (soft delete)' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conta DRE',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta DRE removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta DRE não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.contaDreService.remove(id, parceiroId);
  }
}
