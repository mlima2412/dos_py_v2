import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstoqueSkuService } from './estoque-sku.service';
import { CreateEstoqueSkuDto } from './dto/create-estoque-sku.dto';
import { UpdateEstoqueSkuDto } from './dto/update-estoque-sku.dto';
import { EstoqueSku } from './entities/estoque-sku.entity';

@ApiTags('Estoque SKU')
@Controller('estoque-sku')
@UsePipes(new ValidationPipe({ transform: true }))
export class EstoqueSkuController {
  constructor(private readonly estoqueSkuService: EstoqueSkuService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo registro de estoque SKU' })
  @ApiBody({
    type: CreateEstoqueSkuDto,
    description: 'Dados para criação do registro de estoque',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro de estoque criado com sucesso',
    type: EstoqueSku,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe registro de estoque para este SKU neste local',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'SKU ou local não encontrado' })
  create(@Body() createEstoqueSkuDto: CreateEstoqueSkuDto): Promise<EstoqueSku> {
    return this.estoqueSkuService.create(createEstoqueSkuDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os registros de estoque' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de estoque retornada com sucesso',
    type: [EstoqueSku],
  })
  findAll(): Promise<EstoqueSku[]> {
    return this.estoqueSkuService.findAll();
  }

  @Get('local/:localId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar estoque por local' })
  @ApiParam({
    name: 'localId',
    description: 'ID do local de estoque',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estoque do local retornada com sucesso',
    type: [EstoqueSku],
  })
  findByLocal(
    @Param('localId', ParseIntPipe) localId: number,
  ): Promise<EstoqueSku[]> {
    return this.estoqueSkuService.findByLocal(localId);
  }

  @Get('sku/:skuId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar estoque por SKU' })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estoque do SKU retornada com sucesso',
    type: [EstoqueSku],
  })
  findBySku(
    @Param('skuId', ParseIntPipe) skuId: number,
  ): Promise<EstoqueSku[]> {
    return this.estoqueSkuService.findBySku(skuId);
  }

  @Get(':localId/:skuId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar registro específico de estoque' })
  @ApiParam({
    name: 'localId',
    description: 'ID do local de estoque',
    example: 1,
  })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de estoque encontrado com sucesso',
    type: EstoqueSku,
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de estoque não encontrado',
  })
  findOne(
    @Param('localId', ParseIntPipe) localId: number,
    @Param('skuId', ParseIntPipe) skuId: number,
  ): Promise<EstoqueSku> {
    return this.estoqueSkuService.findOne(localId, skuId);
  }

  @Patch(':localId/:skuId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar quantidade em estoque' })
  @ApiParam({
    name: 'localId',
    description: 'ID do local de estoque',
    example: 1,
  })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiBody({
    type: UpdateEstoqueSkuDto,
    description: 'Dados para atualização do estoque',
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque atualizado com sucesso',
    type: EstoqueSku,
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de estoque não encontrado',
  })
  update(
    @Param('localId', ParseIntPipe) localId: number,
    @Param('skuId', ParseIntPipe) skuId: number,
    @Body() updateEstoqueSkuDto: UpdateEstoqueSkuDto,
  ): Promise<EstoqueSku> {
    return this.estoqueSkuService.update(localId, skuId, updateEstoqueSkuDto);
  }

  @Patch(':localId/:skuId/ajustar/:adjustment')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ajustar quantidade em estoque (somar/subtrair)' })
  @ApiParam({
    name: 'localId',
    description: 'ID do local de estoque',
    example: 1,
  })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiParam({
    name: 'adjustment',
    description: 'Valor do ajuste (positivo para adicionar, negativo para subtrair)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Estoque ajustado com sucesso',
    type: EstoqueSku,
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de estoque não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Ajuste resultaria em quantidade negativa',
  })
  adjustQuantity(
    @Param('localId', ParseIntPipe) localId: number,
    @Param('skuId', ParseIntPipe) skuId: number,
    @Param('adjustment', ParseIntPipe) adjustment: number,
  ): Promise<EstoqueSku> {
    return this.estoqueSkuService.adjustQuantity(localId, skuId, adjustment);
  }

  @Delete(':localId/:skuId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir registro de estoque' })
  @ApiParam({
    name: 'localId',
    description: 'ID do local de estoque',
    example: 1,
  })
  @ApiParam({
    name: 'skuId',
    description: 'ID do SKU',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Registro de estoque excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de estoque não encontrado',
  })
  remove(
    @Param('localId', ParseIntPipe) localId: number,
    @Param('skuId', ParseIntPipe) skuId: number,
  ): Promise<void> {
    return this.estoqueSkuService.remove(localId, skuId);
  }
}
