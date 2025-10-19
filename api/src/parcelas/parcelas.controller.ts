import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ParcelasService } from './parcelas.service';
import { CreateParcelaDto } from './dto/create-parcela.dto';
import { UpdateParcelaDto } from './dto/update-parcela.dto';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Parcela } from './entities/parcela.entity';

@ApiTags('Parcelas')
@Controller('parcelas')
export class ParcelasController {
  constructor(private readonly parcelasService: ParcelasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova Parcela' })
  @ApiBody({ type: CreateParcelaDto })
  @ApiResponse({ status: 201, description: 'Parcela criada', type: Parcela })
  create(@Body() createParcelaDto: CreateParcelaDto) {
    return this.parcelasService.create(createParcelaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar parcelas por parcelamento' })
  @ApiQuery({ name: 'parcelamentoId', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de parcelas', type: [Parcela] })
  findAll(@Query('parcelamentoId') parcelamentoId: string) {
    return this.parcelasService.findAll(Number(parcelamentoId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma Parcela por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Parcela encontrada', type: Parcela })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  findOne(@Param('id') id: string) {
    return this.parcelasService.findOne(Number(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma Parcela' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateParcelaDto })
  @ApiResponse({ status: 200, description: 'Parcela atualizada', type: Parcela })
  update(@Param('id') id: string, @Body() updateParcelaDto: UpdateParcelaDto) {
    return this.parcelasService.update(Number(id), updateParcelaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma Parcela' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Parcela removida' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.parcelasService.remove(Number(id));
  }
}
