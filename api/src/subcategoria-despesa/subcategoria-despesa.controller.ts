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
import { SubCategoriaDespesaService } from './subcategoria-despesa.service';
import { CreateSubCategoriaDespesaDto } from './dto/create-subcategoria-despesa.dto';
import { UpdateSubCategoriaDespesaDto } from './dto/update-subcategoria-despesa.dto';
import { SubCategoriaDespesa } from './entities/subcategoria-despesa.entity';

@ApiTags('subcategoria-despesa')
@ApiBearerAuth('JWT-auth')
@Controller('subcategoria-despesa')
export class SubCategoriaDespesaController {
  constructor(private readonly subCategoriaDespesaService: SubCategoriaDespesaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova subcategoria de despesas' })
  @ApiBody({
    type: CreateSubCategoriaDespesaDto,
    examples: {
      restaurante: {
        summary: 'Subcategoria Restaurante',
        value: {
          categoriaId: 1,
          descricao: 'Restaurante',
          ativo: true,
        },
      },
      combustivel: {
        summary: 'Subcategoria Combustível',
        value: {
          categoriaId: 2,
          descricao: 'Combustível',
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subcategoria de despesas criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        idSubCategoria: { type: 'number', example: 1 },
        categoriaId: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Restaurante' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        categoria: {
          type: 'object',
          properties: {
            idCategoria: { type: 'number', example: 1 },
            descricao: { type: 'string', example: 'Alimentação' },
            ativo: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Categoria de despesas não encontrada' })
  @ApiResponse({ status: 409, description: 'Descrição da subcategoria já existe nesta categoria' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createSubCategoriaDespesaDto: CreateSubCategoriaDespesaDto): Promise<SubCategoriaDespesa> {
    return this.subCategoriaDespesaService.create(createSubCategoriaDespesaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as subcategorias de despesas ativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subcategorias de despesas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idSubCategoria: { type: 'number', example: 1 },
          categoriaId: { type: 'number', example: 1 },
          descricao: { type: 'string', example: 'Restaurante' },
          ativo: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          categoria: {
            type: 'object',
            properties: {
              idCategoria: { type: 'number', example: 1 },
              descricao: { type: 'string', example: 'Alimentação' },
              ativo: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(): Promise<SubCategoriaDespesa[]> {
    return this.subCategoriaDespesaService.findAll();
  }

  @Get('categoria/:categoriaId')
  @ApiOperation({ summary: 'Listar subcategorias de despesas por categoria' })
  @ApiParam({ name: 'categoriaId', description: 'ID da categoria de despesas', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subcategorias da categoria retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idSubCategoria: { type: 'number', example: 1 },
          categoriaId: { type: 'number', example: 1 },
          descricao: { type: 'string', example: 'Restaurante' },
          ativo: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          categoria: {
            type: 'object',
            properties: {
              idCategoria: { type: 'number', example: 1 },
              descricao: { type: 'string', example: 'Alimentação' },
              ativo: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findByCategoria(@Param('categoriaId', ParseIntPipe) categoriaId: number): Promise<SubCategoriaDespesa[]> {
    return this.subCategoriaDespesaService.findByCategoria(categoriaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar subcategoria de despesas por ID' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria de despesas', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Subcategoria de despesas encontrada',
    schema: {
      type: 'object',
      properties: {
        idSubCategoria: { type: 'number', example: 1 },
        categoriaId: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Restaurante' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        categoria: {
          type: 'object',
          properties: {
            idCategoria: { type: 'number', example: 1 },
            descricao: { type: 'string', example: 'Alimentação' },
            ativo: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Subcategoria de despesas não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SubCategoriaDespesa> {
    return this.subCategoriaDespesaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar subcategoria de despesas' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria de despesas', type: 'number' })
  @ApiBody({
    type: UpdateSubCategoriaDespesaDto,
    examples: {
      atualizarDescricao: {
        summary: 'Atualizar descrição',
        value: {
          descricao: 'Fast Food',
        },
      },
      mudarCategoria: {
        summary: 'Mudar categoria',
        value: {
          categoriaId: 2,
        },
      },
      desativar: {
        summary: 'Desativar subcategoria',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategoria de despesas atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        idSubCategoria: { type: 'number', example: 1 },
        categoriaId: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Fast Food' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        categoria: {
          type: 'object',
          properties: {
            idCategoria: { type: 'number', example: 1 },
            descricao: { type: 'string', example: 'Alimentação' },
            ativo: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Subcategoria de despesas não encontrada' })
  @ApiResponse({ status: 409, description: 'Descrição da subcategoria já existe nesta categoria' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubCategoriaDespesaDto: UpdateSubCategoriaDespesaDto,
  ): Promise<SubCategoriaDespesa> {
    return this.subCategoriaDespesaService.update(id, updateSubCategoriaDespesaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover subcategoria de despesas (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria de despesas', type: 'number' })
  @ApiResponse({ status: 200, description: 'Subcategoria de despesas removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Subcategoria de despesas não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.subCategoriaDespesaService.remove(id);
  }
}