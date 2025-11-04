import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ConferenciaEstoqueService } from './conferencia-estoque.service';
import { CreateConferenciaEstoqueDto } from './dto/create-conferencia-estoque.dto';
import { UpdateConferenciaEstoqueDto } from './dto/update-conferencia-estoque.dto';
import { ConferenciaEstoqueResponseDto } from './dto/conferencia-estoque-response.dto';
import { ConferenciaEstoque } from './entities/conferencia-estoque.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { PaginatedConferenciaEstoqueResponseDto } from './dto/paginated-conferencia-response.dto';
import { LocalEmConferenciaResponseDto } from './dto/local-em-conferencia-response.dto';

@ApiTags('Conferência de Estoque')
@Controller('conferencia-estoque')
export class ConferenciaEstoqueController {
  constructor(
    private readonly conferenciaEstoqueService: ConferenciaEstoqueService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar nova conferência de estoque' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateConferenciaEstoqueDto })
  @ApiResponse({
    status: 201,
    description: 'Conferência de estoque criada com sucesso',
    type: ConferenciaEstoqueResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Local de estoque ou usuário não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma conferência em andamento para este local',
  })
  create(
    @Body() createConferenciaEstoqueDto: CreateConferenciaEstoqueDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    return this.conferenciaEstoqueService.create(
      createConferenciaEstoqueDto,
      parceiroId,
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as conferências de estoque' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conferências de estoque',
    type: [ConferenciaEstoqueResponseDto],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<ConferenciaEstoque[]> {
    return this.conferenciaEstoqueService.findAll(parceiroId);
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar conferências de estoque paginadas' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de conferências de estoque',
    type: PaginatedConferenciaEstoqueResponseDto,
  })
  async findPaginated(
    @Query() query: PaginatedQueryDto,
    @ParceiroId() parceiroId: number,
  ) {
    return this.conferenciaEstoqueService.findPaginated({
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      status: query.status,
      localEstoqueId: query.localEstoqueId,
      parceiroId,
    });
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar conferência de estoque por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da conferência de estoque',
  })
  @ApiResponse({
    status: 200,
    description: 'Conferência de estoque encontrada',
    type: ConferenciaEstoqueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conferência de estoque não encontrada',
  })
  findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    return this.conferenciaEstoqueService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar conferência de estoque' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da conferência de estoque',
  })
  @ApiBody({ type: UpdateConferenciaEstoqueDto })
  @ApiResponse({
    status: 200,
    description: 'Conferência de estoque atualizada com sucesso',
    type: ConferenciaEstoqueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conferência de estoque não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou conferência finalizada',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateConferenciaEstoqueDto: UpdateConferenciaEstoqueDto,
    @ParceiroId() parceiroId: number,
  ): Promise<ConferenciaEstoque> {
    return this.conferenciaEstoqueService.update(
      publicId,
      updateConferenciaEstoqueDto,
      parceiroId,
    );
  }

  @Get('local/:localPublicId/em-conferencia')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verificar se local de estoque está em processo de conferência' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ 
    name: 'localPublicId', 
    description: 'ID público do local de estoque',
    example: 'local-123-abc'
  })
  @ApiResponse({
    status: 200,
    description: 'Status da conferência do local de estoque',
    type: LocalEmConferenciaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Local de estoque não encontrado' })
  async checkLocalEmConferencia(
    @Param('localPublicId') localPublicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<{ emConferencia: boolean }> {
    const emConferencia = await this.conferenciaEstoqueService.isLocalEstoqueEmConferencia(
      localPublicId,
      parceiroId,
    );
    return { emConferencia };
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover conferência de estoque' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da conferência de estoque',
  })
  @ApiResponse({
    status: 204,
    description: 'Conferência de estoque removida com sucesso',
  })
  remove(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.conferenciaEstoqueService.remove(publicId, parceiroId);
  }
}
