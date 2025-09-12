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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriaProdutoService } from './categoria-produto.service';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto';

@ApiTags('Categoria Produto')
@Controller('categoria-produto')
export class CategoriaProdutoController {
  constructor(
    private readonly categoriaProdutoService: CategoriaProdutoService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar uma nova categoria de produto' })
  @ApiBody({
    type: CreateCategoriaProdutoDto,
    examples: {
      Conjuntos: {
        summary: 'Categoria Conjuntos',
        description: 'Exemplo de criação de categoria para conjuntos',
        value: {
          descricao: 'Conjuntos',
        },
      },
      Blusa: {
        summary: 'Categoria Blusa',
        description: 'Exemplo de criação de categoria para blusas',
        value: {
          descricao: 'Blusas',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria de produto criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Eletrônicos' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Categoria com esta descrição já existe',
  })
  create(@Body() createCategoriaProdutoDto: CreateCategoriaProdutoDto) {
    console.log(createCategoriaProdutoDto);
    return this.categoriaProdutoService.create(createCategoriaProdutoDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as categorias de produto' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias de produto retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          descricao: { type: 'string', example: 'Eletrônicos' },
        },
      },
    },
  })
  findAll() {
    return this.categoriaProdutoService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar categoria de produto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de produto',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de produto encontrada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Eletrônicos' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de produto não encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaProdutoService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar categoria de produto' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de produto',
    example: 1,
  })
  @ApiBody({
    type: UpdateCategoriaProdutoDto,
    examples: {
      update: {
        summary: 'Atualizar Categoria',
        description: 'Exemplo de atualização de categoria de produto',
        value: {
          descricao: 'Eletrônicos e Tecnologia',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de produto atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        descricao: { type: 'string', example: 'Eletrônicos e Tecnologia' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de produto não encontrada',
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Categoria com esta descrição já existe',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaProdutoDto: UpdateCategoriaProdutoDto,
  ) {
    return this.categoriaProdutoService.update(id, updateCategoriaProdutoDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remover categoria de produto' })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria de produto',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria de produto removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria de produto não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover categoria em uso por produtos',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaProdutoService.remove(id);
  }
}
