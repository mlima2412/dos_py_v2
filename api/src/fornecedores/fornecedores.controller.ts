import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FornecedoresService } from './fornecedores.service';
import { CreateFornecedorDto } from './dto/create-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/update-fornecedor.dto';
import { Fornecedor } from './entities/fornecedor.entity';

@ApiTags('Fornecedores')
@Controller('fornecedores')
@UsePipes(new ValidationPipe({ transform: true }))
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo fornecedor' })
  @ApiBody({
    type: CreateFornecedorDto,
    description: 'Dados para criação do fornecedor',
  })
  @ApiResponse({
    status: 201,
    description: 'Fornecedor criado com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 409,
    description: 'Email ou RUC/CNPJ já está em uso',
  })
  create(
    @Body() createFornecedorDto: CreateFornecedorDto,
  ): Promise<Fornecedor> {
    return this.fornecedoresService.create(createFornecedorDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os fornecedores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fornecedores retornada com sucesso',
    type: [Fornecedor],
  })
  findAll(): Promise<Fornecedor[]> {
    return this.fornecedoresService.findAll();
  }

  @Get('ativos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar fornecedores ativos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fornecedores ativos retornada com sucesso',
    type: [Fornecedor],
  })
  findActiveFornecedores(): Promise<Fornecedor[]> {
    return this.fornecedoresService.findActiveFornecedores();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar fornecedor por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor encontrado com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor não encontrado',
  })
  findOne(@Param('publicId') publicId: string): Promise<Fornecedor> {
    return this.fornecedoresService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar dados do fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiBody({
    type: UpdateFornecedorDto,
    description: 'Dados para atualização do fornecedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor atualizado com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email ou RUC/CNPJ já está em uso',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateFornecedorDto: UpdateFornecedorDto,
  ): Promise<Fornecedor> {
    return this.fornecedoresService.update(publicId, updateFornecedorDto);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desativar fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor desativado com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor não encontrado',
  })
  deactivateFornecedor(
    @Param('publicId') publicId: string,
  ): Promise<Fornecedor> {
    return this.fornecedoresService.deactivateFornecedor(publicId);
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor ativado com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor não encontrado',
  })
  activateFornecedor(@Param('publicId') publicId: string): Promise<Fornecedor> {
    return this.fornecedoresService.activateFornecedor(publicId);
  }

  @Patch(':publicId/ultima-compra')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar data da última compra' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Data da última compra atualizada com sucesso',
    type: Fornecedor,
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor não encontrado',
  })
  updateUltimaCompra(@Param('publicId') publicId: string): Promise<Fornecedor> {
    return this.fornecedoresService.updateUltimaCompra(publicId);
  }
}
