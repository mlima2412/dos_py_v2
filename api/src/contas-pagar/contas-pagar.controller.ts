import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContasPagarService } from './contas-pagar.service';
import { CreateContasPagarDto } from './dto/create-contas-pagar.dto';
import { UpdateContasPagarDto } from './dto/update-contas-pagar.dto';
import { ContasPagar } from './entities/contas-pagar.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contas a Pagar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contas-pagar')
export class ContasPagarController {
  constructor(private readonly contasPagarService: ContasPagarService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta a pagar' })
  @ApiBody({ type: CreateContasPagarDto })
  @ApiResponse({
    status: 201,
    description: 'Conta a pagar criada com sucesso.',
    type: ContasPagar,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(
    @Body() createContasPagarDto: CreateContasPagarDto,
  ): Promise<ContasPagar> {
    return this.contasPagarService.create(createContasPagarDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as contas a pagar' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas a pagar.',
    type: [ContasPagar],
  })
  async findAll(): Promise<ContasPagar[]> {
    return this.contasPagarService.findAll();
  }

  @Get('parceiro/:parceiroId')
  @ApiOperation({ summary: 'Buscar contas a pagar por parceiro' })
  @ApiParam({ name: 'parceiroId', description: 'ID do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Contas a pagar do parceiro.',
    type: [ContasPagar],
  })
  async findByParceiro(
    @Param('parceiroId', ParseIntPipe) parceiroId: number,
  ): Promise<ContasPagar[]> {
    return this.contasPagarService.findByParceiro(parceiroId);
  }

  @Get('origem-tipo/:origemTipo')
  @ApiOperation({ summary: 'Buscar contas a pagar por tipo de origem' })
  @ApiParam({ name: 'origemTipo', description: 'Tipo de origem da conta' })
  @ApiResponse({
    status: 200,
    description: 'Contas a pagar por tipo de origem.',
    type: [ContasPagar],
  })
  async findByOrigemTipo(
    @Param('origemTipo') origemTipo: string,
  ): Promise<ContasPagar[]> {
    return this.contasPagarService.findByOrigemTipo(origemTipo);
  }

  @Get('status/:pago')
  @ApiOperation({ summary: 'Buscar contas a pagar por status de pagamento' })
  @ApiParam({ name: 'pago', description: 'Status de pagamento (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'Contas a pagar por status.',
    type: [ContasPagar],
  })
  async findByStatus(
    @Param('pago', ParseBoolPipe) pago: boolean,
  ): Promise<ContasPagar[]> {
    return this.contasPagarService.findByStatus(pago);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Buscar conta a pagar por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID público da conta a pagar' })
  @ApiResponse({
    status: 200,
    description: 'Conta a pagar encontrada.',
    type: ContasPagar,
  })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada.' })
  async findOne(@Param('publicId') publicId: string): Promise<ContasPagar> {
    return this.contasPagarService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Atualizar conta a pagar' })
  @ApiParam({ name: 'publicId', description: 'ID público da conta a pagar' })
  @ApiBody({ type: UpdateContasPagarDto })
  @ApiResponse({
    status: 200,
    description: 'Conta a pagar atualizada com sucesso.',
    type: ContasPagar,
  })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada.' })
  async update(
    @Param('publicId') publicId: string,
    @Body() updateContasPagarDto: UpdateContasPagarDto,
  ): Promise<ContasPagar> {
    return this.contasPagarService.update(publicId, updateContasPagarDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Remover conta a pagar' })
  @ApiParam({ name: 'publicId', description: 'ID público da conta a pagar' })
  @ApiResponse({
    status: 200,
    description: 'Conta a pagar removida com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada.' })
  async remove(@Param('publicId') publicId: string): Promise<void> {
    return this.contasPagarService.remove(publicId);
  }
}
