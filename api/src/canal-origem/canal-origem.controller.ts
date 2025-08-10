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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CanalOrigemService } from './canal-origem.service';
import { CreateCanalOrigemDto } from './dto/create-canal-origem.dto';
import { UpdateCanalOrigemDto } from './dto/update-canal-origem.dto';
import { CanalOrigem } from './entities/canal-origem.entity';

@ApiTags('Canal de Origem')
@Controller('canal-origem')
export class CanalOrigemController {
  constructor(private readonly canalOrigemService: CanalOrigemService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar novo canal de origem' })
  @ApiResponse({
    status: 201,
    description: 'Canal de origem criado com sucesso',
    type: CanalOrigem,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou regras de negócio violadas' })
  create(@Body() createCanalOrigemDto: CreateCanalOrigemDto): Promise<CanalOrigem> {
    return this.canalOrigemService.create(createCanalOrigemDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os canais de origem' })
  @ApiResponse({
    status: 200,
    description: 'Lista de canais de origem',
    type: [CanalOrigem],
  })
  findAll(): Promise<CanalOrigem[]> {
    return this.canalOrigemService.findAll();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar canal de origem por ID' })
  @ApiParam({ name: 'publicId', description: 'ID público do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Canal de origem encontrado',
    type: CanalOrigem,
  })
  @ApiResponse({ status: 404, description: 'Canal de origem não encontrado' })
  findOne(@Param('publicId') publicId: string): Promise<CanalOrigem> {
    return this.canalOrigemService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar canal de origem' })
  @ApiParam({ name: 'publicId', description: 'ID público do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Canal de origem atualizado com sucesso',
    type: CanalOrigem,
  })
  @ApiResponse({ status: 404, description: 'Canal de origem não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou regras de negócio violadas' })
  update(
    @Param('publicId') publicId: string,
    @Body() updateCanalOrigemDto: UpdateCanalOrigemDto,
  ): Promise<CanalOrigem> {
    return this.canalOrigemService.update(publicId, updateCanalOrigemDto);
  }

  @Delete(':publicId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir canal de origem' })
  @ApiParam({ name: 'publicId', description: 'ID público do canal de origem' })
  @ApiResponse({ status: 204, description: 'Canal de origem excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Canal de origem não encontrado' })
  @ApiResponse({ status: 400, description: 'Canal de origem não pode ser removido pois possui clientes associados' })
  remove(@Param('publicId') publicId: string): Promise<void> {
    return this.canalOrigemService.remove(publicId);
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar canal de origem' })
  @ApiParam({ name: 'publicId', description: 'ID público do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Canal de origem ativado com sucesso',
    type: CanalOrigem,
  })
  @ApiResponse({ status: 404, description: 'Canal de origem não encontrado' })
  activate(@Param('publicId') publicId: string): Promise<CanalOrigem> {
    return this.canalOrigemService.activate(publicId);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desativar canal de origem' })
  @ApiParam({ name: 'publicId', description: 'ID público do canal de origem' })
  @ApiResponse({
    status: 200,
    description: 'Canal de origem desativado com sucesso',
    type: CanalOrigem,
  })
  @ApiResponse({ status: 404, description: 'Canal de origem não encontrado' })
  deactivate(@Param('publicId') publicId: string): Promise<CanalOrigem> {
    return this.canalOrigemService.deactivate(publicId);
  }
}