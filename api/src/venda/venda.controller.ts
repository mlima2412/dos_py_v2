import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VendaService } from './venda.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { PaginatedQueryDto } from './dto/paginated-query.dto';
import { PaginatedVendaResponseDto } from './dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Venda } from './entities/venda.entity';
import { VendaStatus } from '@prisma/client';

@ApiTags('Venda')
@Controller('venda')
export class VendaController {
  constructor(private readonly vendaService: VendaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Criar uma venda' })
  @ApiResponse({
    status: 201,
    description: 'Venda criada com sucesso',
    type: Venda,
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  create(
    @Body() createVendaDto: CreateVendaDto,
    @UserId() userId: number,
    @ParceiroId() parceiroId: number,
  ): Promise<Venda> {
    return this.vendaService.create(createVendaDto, userId, parceiroId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({
    summary:
      'Listar vendas do parceiro retornando dados da venda, nome do cliente, nome do usuário e itens vendidos',
  })
  @ApiResponse({ status: 200, description: 'Lista de vendas', type: [Venda] })
  findAll(@ParceiroId() parceiroId: number): Promise<Venda[]> {
    return this.vendaService.findAll(parceiroId);
  }

  @Get('paginate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({
    summary: 'Buscar vendas paginadas (busca principal, sem relações)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: VendaStatus })
  @ApiResponse({
    status: 200,
    description: 'Vendas paginadas',
    type: PaginatedVendaResponseDto,
  })
  paginate(
    @Query() query: PaginatedQueryDto,
    @ParceiroId() parceiroId: number,
  ): Promise<PaginatedVendaResponseDto> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const status = query.status as VendaStatus | undefined;
    return this.vendaService.paginate(parceiroId, page, limit, status);
  }

  @Get(':publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Buscar uma venda por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID público da venda' })
  @ApiResponse({ status: 200, description: 'Venda encontrada', type: Venda })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  findOne(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Venda> {
    return this.vendaService.findOne(publicId, parceiroId);
  }

  @Patch(':publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Atualizar dados da venda' })
  @ApiParam({ name: 'publicId', description: 'ID público da venda' })
  @ApiResponse({ status: 200, description: 'Venda atualizada', type: Venda })
  update(
    @Param('publicId') publicId: string,
    @Body() updateVendaDto: UpdateVendaDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Venda> {
    return this.vendaService.update(publicId, updateVendaDto, parceiroId);
  }

  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiOperation({ summary: 'Remover uma venda (apenas se status for PEDIDO)' })
  @ApiParam({ name: 'publicId', description: 'ID público da venda' })
  @ApiResponse({ status: 204, description: 'Venda removida com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Exclusão permitida apenas com status PEDIDO',
  })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.vendaService.remove(publicId, parceiroId);
  }
}
