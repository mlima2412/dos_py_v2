import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
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
import { FormaPagamentoService } from './forma-pagamento.service';
import { CreateFormaPagamentoDto } from './dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from './dto/update-forma-pagamento.dto';
import { FormaPagamentoResponseDto } from './dto/forma-pagamento-response.dto';
import { FormaPagamento } from './entities/forma-pagamento.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Forma de Pagamento')
@Controller('forma-pagamento')
export class FormaPagamentoController {
  constructor(private readonly formaPagamentoService: FormaPagamentoService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar nova forma de pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreateFormaPagamentoDto })
  @ApiResponse({
    status: 201,
    description: 'Forma de pagamento criada com sucesso',
    type: FormaPagamentoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou nome já existe' })
  create(
    @Body() createFormaPagamentoDto: CreateFormaPagamentoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<FormaPagamento> {
    return this.formaPagamentoService.create(createFormaPagamentoDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as formas de pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de formas de pagamento',
    type: [FormaPagamentoResponseDto],
  })
  findAll(@ParceiroId() parceiroId: number): Promise<FormaPagamento[]> {
    return this.formaPagamentoService.findAll(parceiroId);
  }

  @Get('ativas')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar apenas formas de pagamento ativas' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de formas de pagamento ativas',
    type: [FormaPagamentoResponseDto],
  })
  findAllActive(@ParceiroId() parceiroId: number): Promise<FormaPagamento[]> {
    return this.formaPagamentoService.findAllActive(parceiroId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar forma de pagamento por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID da forma de pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Forma de pagamento encontrada',
    type: FormaPagamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forma de pagamento não encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<FormaPagamento> {
    return this.formaPagamentoService.findOne(id, parceiroId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar forma de pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID da forma de pagamento' })
  @ApiBody({ type: UpdateFormaPagamentoDto })
  @ApiResponse({
    status: 200,
    description: 'Forma de pagamento atualizada com sucesso',
    type: FormaPagamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forma de pagamento não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou nome já existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFormaPagamentoDto: UpdateFormaPagamentoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<FormaPagamento> {
    return this.formaPagamentoService.update(id, updateFormaPagamentoDto, parceiroId);
  }

  @Patch(':id/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar forma de pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID da forma de pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Forma de pagamento ativada com sucesso',
    type: FormaPagamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forma de pagamento não encontrada' })
  ativar(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<FormaPagamento> {
    return this.formaPagamentoService.ativar(id, parceiroId);
  }

  @Patch(':id/inativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Inativar forma de pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID da forma de pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Forma de pagamento inativada com sucesso',
    type: FormaPagamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Forma de pagamento não encontrada' })
  inativar(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<FormaPagamento> {
    return this.formaPagamentoService.inativar(id, parceiroId);
  }
}
