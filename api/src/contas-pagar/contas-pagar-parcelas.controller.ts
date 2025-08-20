import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
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
import { ContasPagarParcelasService } from './contas-pagar-parcelas.service';
import { CreateContasPagarParcelasDto } from './dto/create-contas-pagar-parcelas.dto';
import { UpdateContasPagarParcelasDto } from './dto/update-contas-pagar-parcelas.dto';
import { ContasPagarParcelas } from './entities/contas-pagar-parcelas.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contas a Pagar - Parcelas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contas-pagar-parcelas')
export class ContasPagarParcelasController {
  constructor(
    private readonly contasPagarParcelasService: ContasPagarParcelasService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova parcela de conta a pagar' })
  @ApiBody({ type: CreateContasPagarParcelasDto })
  @ApiResponse({
    status: 201,
    description: 'Parcela criada com sucesso.',
    type: ContasPagarParcelas,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(
    @Body() createContasPagarParcelasDto: CreateContasPagarParcelasDto,
  ): Promise<ContasPagarParcelas> {
    return this.contasPagarParcelasService.create(createContasPagarParcelasDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as parcelas de contas a pagar' })
  @ApiResponse({
    status: 200,
    description: 'Lista de parcelas.',
    type: [ContasPagarParcelas],
  })
  async findAll(
  ): Promise<ContasPagarParcelas[]> {
    return this.contasPagarParcelasService.findAll();
  }

  @Get('agenda/:parceiroId')
  @ApiOperation({ summary: 'Listar todas as parcelas de contas a pagar da agenda de compromissos' })
  @ApiParam({
    name: 'parceiroId',
    required: true,
    schema: { type: 'integer', format: 'int64' }, // ou type: Number
    description: 'ID do parceiro',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de parcelas.',
    type: [ContasPagarParcelas],
  })
  async findAllAgenda(
    @Param('parceiroId', ParseIntPipe) parceiroId: number,
  ): Promise<ContasPagarParcelas[]> {
    return this.contasPagarParcelasService.findAllAgenda(parceiroId);
  }

  @Get('contas-pagar/:contasPagarId')
  @ApiOperation({ summary: 'Buscar parcelas por conta a pagar' })
  @ApiParam({ name: 'contasPagarId', description: 'ID da conta a pagar' })
  @ApiResponse({
    status: 200,
    description: 'Parcelas da conta a pagar.',
    type: [ContasPagarParcelas],
  })
  async findByContasPagar(
    @Param('contasPagarId', ParseIntPipe) contasPagarId: number,
  ): Promise<ContasPagarParcelas[]> {
    return this.contasPagarParcelasService.findByContasPagar(contasPagarId);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Buscar parcela por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID público da parcela' })
  @ApiResponse({
    status: 200,
    description: 'Parcela encontrada.',
    type: ContasPagarParcelas,
  })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  async findOne(
    @Param('publicId') publicId: string,
  ): Promise<ContasPagarParcelas> {
    return this.contasPagarParcelasService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Atualizar parcela' })
  @ApiParam({ name: 'publicId', description: 'ID público da parcela' })
  @ApiBody({ type: UpdateContasPagarParcelasDto })
  @ApiResponse({
    status: 200,
    description: 'Parcela atualizada com sucesso.',
    type: ContasPagarParcelas,
  })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  async update(
    @Param('publicId') publicId: string,
    @Body() updateContasPagarParcelasDto: UpdateContasPagarParcelasDto,
  ): Promise<ContasPagarParcelas> {
    return this.contasPagarParcelasService.update(
      publicId,
      updateContasPagarParcelasDto,
    );
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Remover parcela' })
  @ApiParam({ name: 'publicId', description: 'ID público da parcela' })
  @ApiResponse({ status: 200, description: 'Parcela removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  async remove(@Param('publicId') publicId: string): Promise<void> {
    return this.contasPagarParcelasService.remove(publicId);
  }
}
