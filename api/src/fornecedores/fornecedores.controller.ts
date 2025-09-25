import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  UsePipes,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
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
  @ApiOperation({ summary: 'Listar todos os fornecedores de um parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fornecedores retornada com sucesso',
    type: [Fornecedor],
  })
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  findAll(@Headers('x-parceiro-id') parceiroId: string): Promise<Fornecedor[]> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.findAll(parseInt(parceiroId, 10));
  }

  @Get('ativos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar fornecedores ativos' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fornecedores ativos retornada com sucesso',
    type: [Fornecedor],
  })
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  findActiveFornecedores(
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor[]> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.findActiveFornecedores(
      parseInt(parceiroId, 10),
    );
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar fornecedor por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
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
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  findOne(
    @Param('publicId') publicId: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.findOne(publicId, parseInt(parceiroId, 10));
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar dados do fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
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
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateFornecedorDto: UpdateFornecedorDto,
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.update(
      publicId,
      updateFornecedorDto,
      parseInt(parceiroId, 10),
    );
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desativar fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
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
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  deactivateFornecedor(
    @Param('publicId') publicId: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.deactivateFornecedor(
      publicId,
      parseInt(parceiroId, 10),
    );
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar fornecedor' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
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
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  activateFornecedor(
    @Param('publicId') publicId: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.activateFornecedor(
      publicId,
      parseInt(parceiroId, 10),
    );
  }

  @Patch(':publicId/ultima-compra')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar data da última compra' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do fornecedor (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro',
    required: true,
    example: '1',
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
  @ApiResponse({
    status: 400,
    description: 'Header x-parceiro-id é obrigatório',
  })
  updateUltimaCompra(
    @Param('publicId') publicId: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ): Promise<Fornecedor> {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.fornecedoresService.updateUltimaCompra(
      publicId,
      parseInt(parceiroId, 10),
    );
  }
}
