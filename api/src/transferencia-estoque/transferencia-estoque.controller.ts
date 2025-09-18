import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TransferenciaEstoqueService } from './transferencia-estoque.service';
import { CreateTransferenciaEstoqueDto } from './dto/create-transferencia-estoque.dto';
import { ConfirmarRecebimentoDto } from './dto/confirmar-recebimento.dto';
import { TransferenciaEstoqueResponseDto } from './dto/transferencia-estoque-response.dto';
import { CreateTransferenciaResponseDto } from './dto/create-transferencia-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transferência de Estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transferencia-estoque')
export class TransferenciaEstoqueController {
  constructor(
    private readonly transferenciaEstoqueService: TransferenciaEstoqueService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar transferência de estoque',
    description:
      'Cria uma nova transferência de estoque entre locais. O usuário que cria a transferência é obtido automaticamente do token de autenticação.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transferência criada com sucesso',
    type: CreateTransferenciaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de origem ou destino não encontrado',
  })
  async create(
    @Body() createTransferenciaEstoqueDto: CreateTransferenciaEstoqueDto,
    @Request() req: any,
  ): Promise<CreateTransferenciaResponseDto> {
    const usuarioId = req.user.id;
    const result = await this.transferenciaEstoqueService.create(
      createTransferenciaEstoqueDto,
      usuarioId,
    );
    return { publicId: result.publicId };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as transferências',
    description:
      'Retorna todas as transferências de estoque ordenadas por data (mais recentes primeiro)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferências retornada com sucesso',
    type: [TransferenciaEstoqueResponseDto],
  })
  async findAll(): Promise<TransferenciaEstoqueResponseDto[]> {
    return this.transferenciaEstoqueService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar transferência por ID',
    description:
      'Retorna uma transferência de estoque específica pelo seu ID, incluindo todos os itens e movimentos relacionados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Transferência encontrada com sucesso',
    type: TransferenciaEstoqueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<TransferenciaEstoqueResponseDto> {
    return this.transferenciaEstoqueService.findOne(+id);
  }

  @Patch(':id/confirmar-recebimento')
  @ApiOperation({
    summary: 'Confirmar recebimento da transferência',
    description:
      'Confirma o recebimento de uma transferência de estoque. O usuário que confirma é obtido automaticamente do token de autenticação.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Recebimento confirmado com sucesso',
    type: TransferenciaEstoqueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Transferência já foi recebida',
  })
  async confirmarRecebimento(
    @Param('id') id: string,
    @Body() confirmarRecebimentoDto: ConfirmarRecebimentoDto,
    @Request() req: any,
  ): Promise<TransferenciaEstoqueResponseDto> {
    const usuarioId = req.user.id;
    return this.transferenciaEstoqueService.confirmarRecebimento(
      +id,
      confirmarRecebimentoDto,
      usuarioId,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir transferência',
    description:
      'Exclui uma transferência de estoque e reverte todos os movimentos de estoque relacionados. Só é possível excluir transferências não recebidas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da transferência',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Transferência excluída com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir uma transferência já recebida',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.transferenciaEstoqueService.remove(+id);
    return { message: 'Transferência excluída com sucesso' };
  }
}
