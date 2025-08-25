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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { Currency } from './entities/currency.entity';

@ApiTags('Currency')
@Controller('currency')
@ApiBearerAuth()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova moeda' })
  @ApiBody({ type: CreateCurrencyDto })
  @ApiResponse({
    status: 201,
    description: 'Moeda criada com sucesso',
    type: Currency,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Código ISO já existe' })
  create(@Body() createCurrencyDto: CreateCurrencyDto) {
    return this.currencyService.create(createCurrencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as moedas' })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de moedas retornada com sucesso',
    type: [Currency],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query('ativo') ativo?: boolean) {
    return this.currencyService.findAll(ativo);
  }

  @Get('ativos')
  @ApiOperation({ summary: 'Listar apenas moedas ativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de moedas ativas retornada com sucesso',
    type: [Currency],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAllActive() {
    return this.currencyService.findAllActive();
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Buscar moeda por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Moeda encontrada com sucesso',
    type: Currency,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Moeda não encontrada' })
  findOne(@Param('publicId') publicId: string) {
    return this.currencyService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Atualizar moeda' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiBody({ type: UpdateCurrencyDto })
  @ApiResponse({
    status: 200,
    description: 'Moeda atualizada com sucesso',
    type: Currency,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Moeda não encontrada' })
  @ApiResponse({ status: 409, description: 'Código ISO já existe' })
  update(
    @Param('publicId') publicId: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ) {
    return this.currencyService.update(publicId, updateCurrencyDto);
  }

  @Patch(':publicId/activate')
  @ApiOperation({ summary: 'Ativar moeda' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Moeda ativada com sucesso',
    type: Currency,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Moeda não encontrada' })
  @HttpCode(HttpStatus.OK)
  activate(@Param('publicId') publicId: string) {
    return this.currencyService.activate(publicId);
  }

  @Patch(':publicId/deactivate')
  @ApiOperation({ summary: 'Desativar moeda' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Moeda desativada com sucesso',
    type: Currency,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Moeda não encontrada' })
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('publicId') publicId: string) {
    return this.currencyService.deactivate(publicId);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Remover moeda' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público da moeda',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Moeda removida com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Moeda não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Moeda está sendo utilizada e não pode ser removida',
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('publicId') publicId: string) {
    return this.currencyService.remove(publicId);
  }
}
