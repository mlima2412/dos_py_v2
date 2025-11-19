import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ParcelamentoService } from './parcelamento.service';
import { CreateParcelamentoDto } from './dto/create-parcelamento.dto';
import { UpdateParcelamentoDto } from './dto/update-parcelamento.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';
import { Parcelamento } from './entities/parcelamento.entity';
import { ParcelamentoComVendaDto } from './dto/parcelamento-com-venda.dto';
import { ParcelaDto } from './dto/parcela.dto';
import { MarcarParcelaPagaDto } from './dto/marcar-parcela-paga.dto';
import { CriarParcelaEspontaneaDto } from './dto/criar-parcela-espontanea.dto';

@ApiTags('Parcelamento')
@Controller('parcelamento')
export class ParcelamentoController {
  constructor(private readonly parcelamentoService: ParcelamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo Parcelamento' })
  @ApiBody({ type: CreateParcelamentoDto })
  @ApiResponse({ status: 201, description: 'Parcelamento criado', type: Parcelamento })
  create(@Body() createParcelamentoDto: CreateParcelamentoDto) {
    return this.parcelamentoService.create(createParcelamentoDto);
  }

  @Get('parceiro')
  @ApiOperation({ summary: 'Listar todos os parcelamentos do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    required: true,
    description: 'ID do parceiro',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de parcelamentos do parceiro',
    type: [ParcelamentoComVendaDto],
  })
  findAllByParceiro(@Headers('x-parceiro-id') parceiroId: string) {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.parcelamentoService.findAllByParceiro(Number(parceiroId));
  }

  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Listar todos os parcelamentos de um cliente' })
  @ApiHeader({
    name: 'x-parceiro-id',
    required: true,
    description: 'ID do parceiro',
  })
  @ApiParam({ name: 'clienteId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de parcelamentos do cliente',
    type: [ParcelamentoComVendaDto],
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Cliente não pertence ao parceiro',
  })
  findByCliente(
    @Param('clienteId') clienteId: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ) {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.parcelamentoService.findByCliente(
      Number(clienteId),
      Number(parceiroId),
    );
  }

  @Get(':id/parcelas')
  @ApiOperation({ summary: 'Listar todas as parcelas de um parcelamento' })
  @ApiHeader({
    name: 'x-parceiro-id',
    required: true,
    description: 'ID do parceiro',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de parcelas do parcelamento',
    type: [ParcelaDto],
  })
  @ApiResponse({ status: 404, description: 'Parcelamento não encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Parcelamento não pertence ao parceiro',
  })
  findParcelas(
    @Param('id') id: string,
    @Headers('x-parceiro-id') parceiroId: string,
  ) {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.parcelamentoService.findParcelasByParcelamento(
      Number(id),
      Number(parceiroId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um Parcelamento por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Parcelamento encontrado',
    type: Parcelamento,
  })
  @ApiResponse({ status: 404, description: 'Parcelamento não encontrado' })
  findOne(@Param('id') id: string) {
    return this.parcelamentoService.findOne(Number(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um Parcelamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateParcelamentoDto })
  @ApiResponse({ status: 200, description: 'Parcelamento atualizado', type: Parcelamento })
  update(@Param('id') id: string, @Body() updateParcelamentoDto: UpdateParcelamentoDto) {
    return this.parcelamentoService.update(Number(id), updateParcelamentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um Parcelamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Parcelamento removido' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.parcelamentoService.remove(Number(id));
  }

  @Patch('parcela/:parcelaId/marcar-paga')
  @ApiOperation({ summary: 'Marcar uma parcela como paga' })
  @ApiHeader({
    name: 'x-parceiro-id',
    required: true,
    description: 'ID do parceiro',
  })
  @ApiParam({ name: 'parcelaId', type: Number, description: 'ID da parcela' })
  @ApiBody({ type: MarcarParcelaPagaDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Parcela marcada como paga',
    type: ParcelaDto,
  })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Parcela não pertence ao parceiro',
  })
  @ApiResponse({ status: 400, description: 'Parcela já está paga' })
  marcarParcelaPaga(
    @Param('parcelaId') parcelaId: string,
    @Headers('x-parceiro-id') parceiroId: string,
    @Body() dto: MarcarParcelaPagaDto,
  ) {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.parcelamentoService.marcarParcelaPaga(
      Number(parcelaId),
      Number(parceiroId),
      dto.dataPagamento,
    );
  }

  @Post(':id/parcela-espontanea')
  @ApiOperation({
    summary: 'Criar parcela espontânea (pagamento flexível)',
  })
  @ApiHeader({
    name: 'x-parceiro-id',
    required: true,
    description: 'ID do parceiro',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do parcelamento',
  })
  @ApiBody({ type: CriarParcelaEspontaneaDto })
  @ApiResponse({
    status: 201,
    description: 'Parcela criada e marcada como paga',
    type: ParcelaDto,
  })
  @ApiResponse({ status: 404, description: 'Parcelamento não encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Parcelamento não pertence ao parceiro',
  })
  @ApiResponse({
    status: 400,
    description: 'Valor maior que saldo restante',
  })
  criarParcelaEspontanea(
    @Param('id') id: string,
    @Headers('x-parceiro-id') parceiroId: string,
    @Body() dto: CriarParcelaEspontaneaDto,
  ) {
    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }
    return this.parcelamentoService.criarParcelaEspontanea(
      Number(id),
      Number(parceiroId),
      dto.valor,
      dto.dataPagamento,
    );
  }
}
