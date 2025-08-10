import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuarioParceiroService } from './usuario-parceiro.service';
import { CreateUsuarioParceiroDto } from './dto/create-usuario-parceiro.dto';
import { UsuarioParceiro } from './entities/usuario-parceiro.entity';

@ApiTags('Usuario-Parceiro')
@Controller('usuario-parceiro')
export class UsuarioParceiroController {
  constructor(private readonly usuarioParceiroService: UsuarioParceiroService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar uma nova relação usuário-parceiro' })
  @ApiBody({ type: CreateUsuarioParceiroDto })
  @ApiResponse({
    status: 201,
    description: 'Relação usuário-parceiro criada com sucesso',
    type: UsuarioParceiro,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário ou parceiro não encontrado' })
  @ApiResponse({ status: 409, description: 'Relação já existe' })
  async create(@Body() createUsuarioParceiroDto: CreateUsuarioParceiroDto): Promise<UsuarioParceiro> {
    return this.usuarioParceiroService.create(createUsuarioParceiroDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as relações usuário-parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Lista de relações usuário-parceiro',
    type: [UsuarioParceiro],
  })
  async findAll(): Promise<UsuarioParceiro[]> {
    return this.usuarioParceiroService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar relação usuário-parceiro por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID da relação usuário-parceiro',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da relação usuário-parceiro',
    type: UsuarioParceiro,
  })
  @ApiResponse({ status: 404, description: 'Relação não encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UsuarioParceiro> {
    return this.usuarioParceiroService.findOne(id);
  }

  @Get('usuario/:usuarioId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar relações por usuário' })
  @ApiParam({
    name: 'usuarioId',
    description: 'ID do usuário',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relações do usuário',
    type: [UsuarioParceiro],
  })
  async findByUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number): Promise<UsuarioParceiro[]> {
    return this.usuarioParceiroService.findByUsuario(usuarioId);
  }

  @Get('parceiro/:parceiroId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar relações por parceiro' })
  @ApiParam({
    name: 'parceiroId',
    description: 'ID do parceiro',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relações do parceiro',
    type: [UsuarioParceiro],
  })
  async findByParceiro(@Param('parceiroId', ParseIntPipe) parceiroId: number): Promise<UsuarioParceiro[]> {
    return this.usuarioParceiroService.findByParceiro(parceiroId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover relação usuário-parceiro por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID da relação usuário-parceiro',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Relação removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Relação não encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usuarioParceiroService.remove(id);
  }

  @Delete('usuario/:usuarioId/parceiro/:parceiroId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover relação específica usuário-parceiro' })
  @ApiParam({
    name: 'usuarioId',
    description: 'ID do usuário',
    example: 1,
  })
  @ApiParam({
    name: 'parceiroId',
    description: 'ID do parceiro',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Relação removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Relação não encontrada' })
  async removeByUsuarioAndParceiro(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('parceiroId', ParseIntPipe) parceiroId: number,
  ): Promise<void> {
    return this.usuarioParceiroService.removeByUsuarioAndParceiro(usuarioId, parceiroId);
  }
}