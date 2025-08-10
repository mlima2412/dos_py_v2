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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { PerfisService } from './perfis.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@ApiTags('Perfis')
@Controller('perfis')
export class PerfisController {
  constructor(private readonly perfisService: PerfisService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar um novo perfil' })
  @ApiBody({
    type: CreatePerfilDto,
    examples: {
      admin: {
        summary: 'Perfil Administrador',
        description: 'Exemplo de criação de perfil administrativo',
        value: {
          nome: 'Administrador',
          descricao: 'Perfil com acesso total ao sistema'
        }
      },
      usuario: {
        summary: 'Perfil Usuário',
        description: 'Exemplo de criação de perfil de usuário comum',
        value: {
          nome: 'Usuário',
          descricao: 'Perfil com acesso limitado ao sistema'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        nome: { type: 'string', example: 'Administrador' },
        descricao: { type: 'string', example: 'Perfil com acesso total ao sistema' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Perfil com este nome já existe' })
  create(@Body() createPerfilDto: CreatePerfilDto) {
    return this.perfisService.create(createPerfilDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os perfis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfis retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          nome: { type: 'string', example: 'Administrador' },
          descricao: { type: 'string', example: 'Perfil com acesso total ao sistema' },
          ativo: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  findAll() {
    return this.perfisService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  @ApiParam({ name: 'id', description: 'ID do perfil', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        nome: { type: 'string', example: 'Administrador' },
        descricao: { type: 'string', example: 'Perfil com acesso total ao sistema' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.perfisService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar perfil' })
  @ApiParam({ name: 'id', description: 'ID do perfil', example: 1 })
  @ApiBody({
    type: UpdatePerfilDto,
    examples: {
      update: {
        summary: 'Atualizar Perfil',
        description: 'Exemplo de atualização de perfil',
        value: {
          nome: 'Administrador Geral',
          descricao: 'Perfil com acesso total e gerenciamento do sistema'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        nome: { type: 'string', example: 'Administrador Geral' },
        descricao: { type: 'string', example: 'Perfil com acesso total e gerenciamento do sistema' },
        ativo: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Perfil com este nome já existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerfilDto: UpdatePerfilDto,
  ) {
    return this.perfisService.update(id, updatePerfilDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remover perfil' })
  @ApiParam({ name: 'id', description: 'ID do perfil', example: 1 })
  @ApiResponse({ status: 200, description: 'Perfil removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível remover perfil em uso' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.perfisService.remove(id);
  }
}