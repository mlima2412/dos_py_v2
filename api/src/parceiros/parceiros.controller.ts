import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
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
import { ParceirosService } from './parceiros.service';
import { CreateParceiroDto } from './dto/create-parceiro.dto';
import { UpdateParceiroDto } from './dto/update-parceiro.dto';
import { Parceiro } from './entities/parceiro.entity';

@ApiTags('Parceiros')
@Controller('parceiros')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ParceirosController {
  constructor(private readonly parceirosService: ParceirosService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar um novo parceiro' })
  @ApiBody({ type: CreateParceiroDto })
  @ApiResponse({
    status: 201,
    description: 'Parceiro criado com sucesso',
    type: Parceiro,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou RUC/CNPJ já existe' })
  async create(@Body() createParceiroDto: CreateParceiroDto): Promise<Parceiro> {
    console.log("!Criando um novo parceiro....")
    return this.parceirosService.create(createParceiroDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os parceiros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de parceiros',
    type: [Parceiro],
  })
  async findAll(): Promise<Parceiro[]> {
    return this.parceirosService.findAll();
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar parceiros com paginação, busca e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de parceiros retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Parceiro' } },
        total: { type: 'number', description: 'Total de registros' },
        page: { type: 'number', description: 'Página atual' },
        limit: { type: 'number', description: 'Itens por página' },
        totalPages: { type: 'number', description: 'Total de páginas' }
      }
    }
  })
  findPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('ativo') ativo?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const ativoFilter = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    
    return this.parceirosService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search,
      ativo: ativoFilter
    });
  }

  @Get('ativos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar parceiros ativos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de parceiros ativos',
    type: [Parceiro],
  })
  async findActiveParceiros(): Promise<Parceiro[]> {
    return this.parceirosService.findActiveParceiros();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar parceiro por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do parceiro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do parceiro',
    type: Parceiro,
  })
  @ApiResponse({ status: 404, description: 'Parceiro não encontrado' })
  async findOne(@Param('publicId') publicId: string): Promise<Parceiro> {
    return this.parceirosService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar parceiro' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do parceiro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiBody({ type: UpdateParceiroDto })
  @ApiResponse({
    status: 200,
    description: 'Parceiro atualizado com sucesso',
    type: Parceiro,
  })
  @ApiResponse({ status: 404, description: 'Parceiro não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou RUC/CNPJ já existe' })
  async update(
    @Param('publicId') publicId: string,
    @Body() updateParceiroDto: UpdateParceiroDto,
  ): Promise<Parceiro> {
    console.log("!Atualizando um parceiro....")
    return this.parceirosService.update(publicId, updateParceiroDto);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar parceiro' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do parceiro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Parceiro desativado com sucesso',
    type: Parceiro,
  })
  @ApiResponse({ status: 404, description: 'Parceiro não encontrado' })
  async deactivateParceiro(@Param('publicId') publicId: string): Promise<Parceiro> {
    return this.parceirosService.deactivateParceiro(publicId);
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar parceiro' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do parceiro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Parceiro ativado com sucesso',
    type: Parceiro,
  })
  @ApiResponse({ status: 404, description: 'Parceiro não encontrado' })
  async activateParceiro(@Param('publicId') publicId: string): Promise<Parceiro> {
    return this.parceirosService.activateParceiro(publicId);
  }
}