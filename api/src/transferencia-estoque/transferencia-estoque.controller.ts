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
  ApiHeader,
} from '@nestjs/swagger';
import { TransferenciaEstoqueService } from './transferencia-estoque.service';
import { CreateTransferenciaEstoqueDto } from './dto/create-transferencia-estoque.dto';
import { ConfirmarRecebimentoDto } from './dto/confirmar-recebimento.dto';
import { TransferenciaEstoqueResponseDto } from './dto/transferencia-estoque-response.dto';
import { CreateTransferenciaResponseDto } from './dto/create-transferencia-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParceiroId } from '../auth/decorators/parceiro-id.decorator';
import { PublicIdResponseDto } from './dto/message-response.dto';

@ApiTags('Transferência de Estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiHeader({
  name: 'x-parceiro-id',
  description: 'ID do parceiro',
  required: true,
  schema: {
    type: 'integer',
    example: 1,
  },
})
@Controller('transferencia-estoque')
export class TransferenciaEstoqueController {
  constructor(
    private readonly transferenciaEstoqueService: TransferenciaEstoqueService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar transferência de estoque',
    description:
      'Cria uma nova transferência de estoque entre locais. O usuário que cria a transferência é obtido automaticamente do token de autenticação e o parceiro do header x-parceiro-id.',
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
    @ParceiroId() parceiroId: number,
  ): Promise<CreateTransferenciaResponseDto> {
    const usuarioId = req.user.id;
    
    const result = await this.transferenciaEstoqueService.create(
      createTransferenciaEstoqueDto,
      usuarioId,
      parceiroId,
    );
    return { publicId: result.publicId };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as transferências',
    description:
      'Retorna todas as transferências de estoque do parceiro especificado no header, ordenadas por data (mais recentes primeiro)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferências retornada com sucesso',
    type: [TransferenciaEstoqueResponseDto],
  })
  async findAll(@ParceiroId() parceiroId: number): Promise<TransferenciaEstoqueResponseDto[]> {
    return this.transferenciaEstoqueService.findAll(parceiroId);
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Buscar transferência por Public ID',
    description:
      'Retorna uma transferência de estoque específica pelo seu publicId, incluindo todos os itens e movimentos relacionados. Filtra pelo parceiro especificado no header.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID da transferência',
    example: '01234567-89ab-cdef-0123-456789abcdef',
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
    @Param('publicId') publicId: string,
    @ParceiroId() parceiroId: number,
  ): Promise<TransferenciaEstoqueResponseDto> {
    return this.transferenciaEstoqueService.findOne(publicId, parceiroId);
  }

  @Patch(':id/confirmar-recebimento')
  @ApiOperation({
    summary: 'Confirmar recebimento da transferência',
    description:
      'Confirma o recebimento de uma transferência de estoque. O usuário que confirma é obtido automaticamente do token de autenticação e a transferência deve pertencer ao parceiro especificado no header.',
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
    @ParceiroId() parceiroId: number,
  ): Promise<TransferenciaEstoqueResponseDto> {
    const usuarioId = req.user.id;
    return this.transferenciaEstoqueService.confirmarRecebimento(
      +id,
      confirmarRecebimentoDto,
      usuarioId,
      parceiroId,
    );
  }

  @Patch('receber/:publicId')
  @ApiOperation({
    summary: 'Marcar transferência como recebida',
    description:
      'Marca uma transferência de estoque como recebida usando o publicId. O usuário que recebe é obtido automaticamente do token de autenticação e a transferência deve pertencer ao parceiro especificado no header.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID da transferência',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Transferência marcada como recebida com sucesso',
    type: PublicIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transferência não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Transferência já foi recebida',
  })
  async marcarComoRecebida(
    @Param('publicId') publicId: string,
    @Request() req: any,
    @ParceiroId() parceiroId: number,
  ): Promise<{ publicId: string }> {
    const usuarioId = req.user.id;
    return this.transferenciaEstoqueService.marcarComoRecebida(
      publicId,
      usuarioId,
      parceiroId,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir transferência',
    description:
      'Exclui uma transferência de estoque e reverte todos os movimentos de estoque relacionados. Só é possível excluir transferências não recebidas e que pertençam ao parceiro especificado no header.',
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
  async remove(
    @Param('id') id: string,
    @ParceiroId() parceiroId: number,
  ): Promise<{ message: string }> {
    await this.transferenciaEstoqueService.remove(+id, parceiroId);
    return { message: 'Transferência excluída com sucesso' };
  }
}
