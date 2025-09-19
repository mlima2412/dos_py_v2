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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ConferenciaItemService } from './conferencia-item.service';
import { CreateConferenciaItemDto } from './dto/create-conferencia-item.dto';
import { UpdateConferenciaItemDto } from './dto/update-conferencia-item.dto';
import { AjustarItemDto } from './dto/ajustar-item.dto';
import { ConferenciaItemResponseDto } from './dto/conferencia-item-response.dto';
import { ConferenciaItem } from './entities/conferencia-item.entity';

@ApiTags('Conferência Item')
@Controller('conferencia-item')
export class ConferenciaItemController {
  constructor(private readonly conferenciaItemService: ConferenciaItemService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo item de conferência' })
  @ApiBody({ type: CreateConferenciaItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item de conferência criado com sucesso',
    type: ConferenciaItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Conferência ou SKU não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe item para este SKU nesta conferência' })
  create(@Body() createConferenciaItemDto: CreateConferenciaItemDto): Promise<ConferenciaItem> {
    return this.conferenciaItemService.create(createConferenciaItemDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os itens de conferência' })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens de conferência com dados completos do produto',
    type: [ConferenciaItemResponseDto],
  })
  findAll(): Promise<ConferenciaItem[]> {
    return this.conferenciaItemService.findAll();
  }

  @Get('conferencia/:conferenciaId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar itens de uma conferência específica' })
  @ApiParam({ name: 'conferenciaId', description: 'ID da conferência de estoque' })
  @ApiResponse({
    status: 200,
    description: 'Lista de itens da conferência com dados completos do produto',
    type: [ConferenciaItemResponseDto],
  })
  findByConferencia(
    @Param('conferenciaId', ParseIntPipe) conferenciaId: number,
  ): Promise<ConferenciaItem[]> {
    return this.conferenciaItemService.findByConferencia(conferenciaId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar item de conferência por ID' })
  @ApiParam({ name: 'id', description: 'ID do item de conferência' })
  @ApiResponse({
    status: 200,
    description: 'Item de conferência encontrado com dados completos do produto',
    type: ConferenciaItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item de conferência não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ConferenciaItem> {
    return this.conferenciaItemService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar item de conferência' })
  @ApiParam({ name: 'id', description: 'ID do item de conferência' })
  @ApiBody({ type: UpdateConferenciaItemDto })
  @ApiResponse({
    status: 200,
    description: 'Item de conferência atualizado com sucesso',
    type: ConferenciaItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item de conferência não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conferência finalizada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConferenciaItemDto: UpdateConferenciaItemDto,
  ): Promise<ConferenciaItem> {
    return this.conferenciaItemService.update(id, updateConferenciaItemDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover item de conferência' })
  @ApiParam({ name: 'id', description: 'ID do item de conferência' })
  @ApiResponse({
    status: 204,
    description: 'Item de conferência removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Item de conferência não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível remover item de conferência finalizada' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.conferenciaItemService.remove(id);
  }

  @Patch(':id/ajustar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Ajustar estoque baseado na conferência',
    description: 'Ajusta a quantidade no estoque com base na quantidade conferida e cria movimento de estoque para auditoria'
  })
  @ApiParam({ name: 'id', description: 'ID do item de conferência' })
  @ApiBody({ type: AjustarItemDto })
  @ApiResponse({
    status: 200,
    description: 'Estoque ajustado com sucesso',
    type: ConferenciaItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item de conferência não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível ajustar item de conferência finalizada' })
  ajustarEstoque(
    @Param('id', ParseIntPipe) id: number,
    @Body() ajustarItemDto: AjustarItemDto,
  ): Promise<ConferenciaItem> {
    return this.conferenciaItemService.ajustarEstoque(id, ajustarItemDto.ajustar);
  }
}
