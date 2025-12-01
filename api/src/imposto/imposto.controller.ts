import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ImpostoService } from './imposto.service';
import { CreateImpostoDto } from './dto/create-imposto.dto';
import { UpdateImpostoDto } from './dto/update-imposto.dto';
import { Imposto } from './entities/imposto.entity';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';

@ApiTags('imposto')
@ApiBearerAuth('JWT-auth')
@Controller('imposto')
export class ImpostoController {
  constructor(private readonly impostoService: ImpostoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo imposto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiBody({
    type: CreateImpostoDto,
    examples: {
      iva: {
        summary: 'IVA (Paraguai)',
        value: {
          nome: 'Impuesto al Valor Agregado',
          sigla: 'IVA',
          percentual: 10.0,
          ativo: true,
        },
      },
      icms: {
        summary: 'ICMS (Brasil)',
        value: {
          nome: 'Imposto sobre Circulação de Mercadorias',
          sigla: 'ICMS',
          percentual: 18.0,
          ativo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imposto criado com sucesso',
    type: Imposto,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um imposto com esta sigla para este parceiro',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(
    @Body() createImpostoDto: CreateImpostoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Imposto> {
    return this.impostoService.create(createImpostoDto, parceiroId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os impostos do parceiro' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de impostos retornada com sucesso',
    type: [Imposto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@ParceiroId() parceiroId: number): Promise<Imposto[]> {
    return this.impostoService.findAll(parceiroId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar imposto por ID' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do imposto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Imposto encontrado',
    type: Imposto,
  })
  @ApiResponse({
    status: 404,
    description: 'Imposto não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<Imposto> {
    return this.impostoService.findOne(id, parceiroId);
  }

  @Get('sigla/:sigla')
  @ApiOperation({ summary: 'Buscar imposto por sigla' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'sigla',
    description: 'Sigla do imposto (ex: IVA)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Imposto encontrado',
    type: Imposto,
  })
  @ApiResponse({
    status: 404,
    description: 'Imposto não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findBySigla(
    @Param('sigla') sigla: string,
    @ParceiroId() parceiroId: number,
  ): Promise<Imposto> {
    return this.impostoService.findBySigla(sigla, parceiroId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar imposto' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do imposto',
    type: 'number',
  })
  @ApiBody({
    type: UpdateImpostoDto,
    examples: {
      atualizarPercentual: {
        summary: 'Atualizar percentual',
        value: {
          percentual: 12.0,
        },
      },
      desativar: {
        summary: 'Desativar imposto',
        value: {
          ativo: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imposto atualizado com sucesso',
    type: Imposto,
  })
  @ApiResponse({
    status: 404,
    description: 'Imposto não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um imposto com esta sigla para este parceiro',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateImpostoDto: UpdateImpostoDto,
    @ParceiroId() parceiroId: number,
  ): Promise<Imposto> {
    return this.impostoService.update(id, updateImpostoDto, parceiroId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover imposto (soft delete)' })
  @ApiHeader({
    name: 'x-parceiro-id',
    description: 'ID do parceiro logado',
    required: true,
    schema: { type: 'integer', example: 1 },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do imposto',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Imposto removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Imposto não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ParceiroId() parceiroId: number,
  ): Promise<void> {
    return this.impostoService.remove(id, parceiroId);
  }
}
