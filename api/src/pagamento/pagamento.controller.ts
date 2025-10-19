import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
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
  ApiQuery,
} from '@nestjs/swagger';
import { PagamentoService } from './pagamento.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { UpdatePagamentoDto } from './dto/update-pagamento.dto';
import { Pagamento } from './entities/pagamento.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('Pagamento')
@Controller('pagamento')
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo pagamento para uma venda' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({ type: CreatePagamentoDto })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso', type: Pagamento })
  @ApiResponse({ status: 404, description: 'Venda ou forma de pagamento não encontrada' })
  create(@Body() createPagamentoDto: CreatePagamentoDto, @ParceiroId() parceiroId: number): Promise<Pagamento> {
    return this.pagamentoService.create(createPagamentoDto, parceiroId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar pagamentos de uma venda' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiQuery({ name: 'vendaId', required: true, description: 'ID da venda' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos', type: [Pagamento] })
  findAll(
    @Query('vendaId', ParseIntPipe) vendaId: number,
    @ParceiroId() parceiroId: number,
  ): Promise<Pagamento[]> {
    return this.pagamentoService.findAll(vendaId, parceiroId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado', type: Pagamento })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @ParceiroId() parceiroId: number): Promise<Pagamento> {
    return this.pagamentoService.findOne(id, parceiroId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiBody({ type: UpdatePagamentoDto })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado com sucesso', type: Pagamento })
  @ApiResponse({ status: 404, description: 'Pagamento, venda ou forma de pagamento não encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagamentoDto: UpdatePagamentoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Pagamento> {
    return this.pagamentoService.update(id, updatePagamentoDto, parceiroId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remover pagamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 204, description: 'Pagamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @ParceiroId() parceiroId: number): Promise<void> {
    await this.pagamentoService.remove(id, parceiroId);
  }
}
