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
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { GrupoDreService } from './grupo-dre.service';
import { CreateGrupoDreDto } from './dto/create-grupo-dre.dto';
import { UpdateGrupoDreDto } from './dto/update-grupo-dre.dto';
import { GrupoDRE } from './entities/grupo-dre.entity';

@ApiTags('grupo-dre')
@ApiBearerAuth('JWT-auth')
@Controller('grupo-dre')
export class GrupoDreController {
  constructor(private readonly grupoDreService: GrupoDreService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo grupo DRE' })
  @ApiBody({
    type: CreateGrupoDreDto,
    examples: {
      receitas: {
        summary: 'Grupo de Receitas',
        value: {
          codigo: '1000',
          nome: 'Receitas de Vendas',
          tipo: 'RECEITA',
          ordem: 1,
          ativo: true,
        },
      },
      deducoes: {
        summary: 'Grupo de Deduções',
        value: {
          codigo: '2000',
          nome: 'Deduções sobre Receita',
          tipo: 'DEDUCAO',
          ordem: 2,
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Grupo DRE criado com sucesso',
    type: GrupoDRE,
  })
  @ApiResponse({
    status: 409,
    description: 'Código do grupo DRE já está em uso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createGrupoDreDto: CreateGrupoDreDto): Promise<GrupoDRE> {
    return this.grupoDreService.create(createGrupoDreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os grupos DRE ativos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de grupos DRE retornada com sucesso',
    type: [GrupoDRE],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(): Promise<GrupoDRE[]> {
    return this.grupoDreService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar grupo DRE por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do grupo DRE',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo DRE encontrado',
    type: GrupoDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo DRE não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GrupoDRE> {
    return this.grupoDreService.findOne(id);
  }

  @Get('codigo/:codigo')
  @ApiOperation({ summary: 'Buscar grupo DRE por código' })
  @ApiParam({
    name: 'codigo',
    description: 'Código do grupo DRE (ex: 1000)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo DRE encontrado',
    type: GrupoDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo DRE não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByCodigo(@Param('codigo') codigo: string): Promise<GrupoDRE> {
    return this.grupoDreService.findByCodigo(codigo);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar grupo DRE' })
  @ApiParam({
    name: 'id',
    description: 'ID do grupo DRE',
    type: 'number',
  })
  @ApiBody({
    type: UpdateGrupoDreDto,
    examples: {
      atualizarNome: {
        summary: 'Atualizar nome',
        value: {
          nome: 'Receitas Operacionais',
        },
      },
      desativar: {
        summary: 'Desativar grupo',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo DRE atualizado com sucesso',
    type: GrupoDRE,
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo DRE não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Código do grupo DRE já está em uso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrupoDreDto: UpdateGrupoDreDto,
  ): Promise<GrupoDRE> {
    return this.grupoDreService.update(id, updateGrupoDreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover grupo DRE (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID do grupo DRE',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo DRE removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Grupo DRE não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.grupoDreService.remove(id);
  }
}
