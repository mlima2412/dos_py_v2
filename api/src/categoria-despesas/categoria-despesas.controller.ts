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
import { CategoriaDespesasService } from './categoria-despesas.service';
import { CreateCategoriaDespesasDto } from './dto/create-categoria-despesas.dto';
import { UpdateCategoriaDespesasDto } from './dto/update-categoria-despesas.dto';
import { CategoriaDespesas } from './entities/categoria-despesas.entity';

@ApiTags('categoria-despesas')
@ApiBearerAuth('JWT-auth')
@Controller('categoria-despesas')
export class CategoriaDespesasController {
  constructor(
    private readonly categoriaDespesasService: CategoriaDespesasService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria de despesas' })
  @ApiBody({
    type: CreateCategoriaDespesasDto,
    examples: {
      alimentacao: {
        summary: 'Categoria Alimentação',
        value: {
          descricao: 'Alimentação',
          ativo: true,
        },
      },
      transporte: {
        summary: 'Categoria Transporte',
        value: {
          descricao: 'Transporte',
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria de despesas criada com sucesso',
    type: CategoriaDespesas,
  })
  @ApiResponse({
    status: 409,
    description: 'Descrição da categoria já está em uso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(
    @Body() createCategoriaDespesasDto: CreateCategoriaDespesasDto,
  ): Promise<CategoriaDespesas> {
    return this.categoriaDespesasService.create(createCategoriaDespesasDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias de despesas ativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias de despesas retornada com sucesso',
    type: [CategoriaDespesas],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(): Promise<CategoriaDespesas[]> {
    return this.categoriaDespesasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria de despesas por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de despesas',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de despesas encontrada',
    type: CategoriaDespesas,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de despesas não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoriaDespesas> {
    return this.categoriaDespesasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria de despesas' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de despesas',
    type: 'number',
  })
  @ApiBody({
    type: UpdateCategoriaDespesasDto,
    examples: {
      atualizarDescricao: {
        summary: 'Atualizar descrição',
        value: {
          descricao: 'Alimentação e Bebidas',
        },
      },
      desativar: {
        summary: 'Desativar categoria',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de despesas atualizada com sucesso',
    type: CategoriaDespesas,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de despesas não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Descrição da categoria já está em uso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDespesasDto: UpdateCategoriaDespesasDto,
  ): Promise<CategoriaDespesas> {
    return this.categoriaDespesasService.update(id, updateCategoriaDespesasDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover categoria de despesas (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de despesas',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de despesas removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de despesas não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriaDespesasService.remove(id);
  }
}
