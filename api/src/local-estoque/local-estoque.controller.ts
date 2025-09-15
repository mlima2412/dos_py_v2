import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocalEstoqueService } from './local-estoque.service';
import { CreateLocalEstoqueDto } from './dto/create-local-estoque.dto';
import { UpdateLocalEstoqueDto } from './dto/update-local-estoque.dto';
import { LocalEstoque } from './entities/local-estoque.entity';

@ApiTags('Local Estoque')
@Controller('local-estoque')
@UsePipes(new ValidationPipe({ transform: true }))
export class LocalEstoqueController {
  constructor(private readonly localEstoqueService: LocalEstoqueService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo local de estoque' })
  @ApiBody({
    type: CreateLocalEstoqueDto,
    description: 'Dados para criação do local de estoque',
  })
  @ApiResponse({
    status: 201,
    description: 'Local de estoque criado com sucesso',
    type: LocalEstoque,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um local com este nome para este parceiro',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createLocalEstoqueDto: CreateLocalEstoqueDto,
  ): Promise<LocalEstoque> {
    return this.localEstoqueService.create(createLocalEstoqueDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os locais de estoque' })
  @ApiResponse({
    status: 200,
    description: 'Lista de locais de estoque retornada com sucesso',
    type: [LocalEstoque],
  })
  findAll(): Promise<LocalEstoque[]> {
    return this.localEstoqueService.findAll();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar local de estoque por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do local de estoque (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Local de estoque encontrado com sucesso',
    type: LocalEstoque,
  })
  @ApiResponse({
    status: 404,
    description: 'Local de estoque não encontrado',
  })
  findOne(
    @Param('publicId') publicId: string,
  ): Promise<LocalEstoque> {
    return this.localEstoqueService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar dados do local de estoque' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do local de estoque (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiBody({
    type: UpdateLocalEstoqueDto,
    description: 'Dados para atualização do local de estoque',
  })
  @ApiResponse({
    status: 200,
    description: 'Local de estoque atualizado com sucesso',
    type: LocalEstoque,
  })
  @ApiResponse({
    status: 404,
    description: 'Local de estoque não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Nome já está em uso para este parceiro',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateLocalEstoqueDto: UpdateLocalEstoqueDto,
  ): Promise<LocalEstoque> {
    return this.localEstoqueService.update(
      publicId,
      updateLocalEstoqueDto,
    );
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir local de estoque' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do local de estoque (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Local de estoque excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de estoque não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir local que possui produtos em estoque',
  })
  remove(
    @Param('publicId') publicId: string,
  ): Promise<void> {
    return this.localEstoqueService.remove(publicId);
  }
}
