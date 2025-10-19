import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ParcelamentoService } from './parcelamento.service';
import { CreateParcelamentoDto } from './dto/create-parcelamento.dto';
import { UpdateParcelamentoDto } from './dto/update-parcelamento.dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Parcelamento } from './entities/parcelamento.entity';

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

  @Get()
  @ApiOperation({ summary: 'Listar parcelamentos por pagamento' })
  @ApiQuery({ name: 'pagamentoId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de parcelamentos', type: [Parcelamento] })
  findAll(@Query('pagamentoId') pagamentoId: string) {
    return this.parcelamentoService.findAll(Number(pagamentoId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um Parcelamento por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Parcelamento encontrado', type: Parcelamento })
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
}
