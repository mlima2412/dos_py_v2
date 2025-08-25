import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Usuarios')
@Controller('usuarios')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiBody({
    type: CreateUsuarioDto,
    examples: {
      admin: {
        summary: 'Usuário Administrador',
        description: 'Exemplo de criação de usuário administrador',
        value: {
          nome: 'João Silva',
          email: 'joao.silva@empresa.com',
          senha: 'senha123',
          telefone: '(11) 99999-9999',
          // perfilId removido (agora via UsuarioParceiro)
        },
      },
      usuario: {
        summary: 'Usuário Comum',
        description: 'Exemplo de criação de usuário comum',
        value: {
          nome: 'Maria Santos',
          email: 'maria.santos@empresa.com',
          senha: 'senha456',
          telefone: '(11) 88888-8888',
          // perfilId removido (agora via UsuarioParceiro)
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Usuario,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    type: [Usuario],
  })
  findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Get('paginated')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar usuários com paginação, busca e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de usuários retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Usuario' },
        },
        total: { type: 'number', description: 'Total de registros' },
        page: { type: 'number', description: 'Página atual' },
        limit: { type: 'number', description: 'Itens por página' },
        totalPages: { type: 'number', description: 'Total de páginas' },
      },
    },
  })
  findPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('organizacao') organizacao?: string,
    // @Query('perfil') perfil?: string, // filtro de perfil agora via UsuarioParceiro
    @Query('ativo') ativo?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const ativoFilter =
      ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    // const perfilFilter = perfil ? parseInt(perfil, 10) : undefined;

    // Para filtrar por perfil, utilize o endpoint de UsuarioParceiro
    return this.usuariosService.findPaginated({
      page: pageNum,
      limit: limitNum,
      search,
      organizacao,
      ativo: ativoFilter,
    });
  }

  @Get('ativos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar apenas usuários ativos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários ativos retornada com sucesso',
    type: [Usuario],
  })
  findActiveUsers(): Promise<any[]> {
    return this.usuariosService.findActiveUsers();
  }

  @Get(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar usuário por ID público' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do usuário (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado com sucesso',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  findOne(@Param('publicId') publicId: string): Promise<Usuario> {
    return this.usuariosService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do usuário (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiBody({
    type: UpdateUsuarioDto,
    examples: {
      updateProfile: {
        summary: 'Atualizar Perfil',
        description: 'Exemplo de atualização de dados do usuário',
        value: {
          nome: 'João Silva Santos',
          telefone: '(11) 99999-0000',
          avatar: 'https://exemplo.com/avatar.jpg',
        },
      },
      changePassword: {
        summary: 'Alterar Senha',
        description: 'Exemplo de alteração de senha',
        value: {
          senha: 'novaSenha123',
        },
      },
      // Exemplo de alteração de perfil removido (agora via UsuarioParceiro)
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    return this.usuariosService.update(publicId, updateUsuarioDto);
  }

  @Patch(':publicId/desativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desativar usuário' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do usuário (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário desativado com sucesso',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  deactivateUser(@Param('publicId') publicId: string): Promise<Usuario> {
    return this.usuariosService.deactivateUser(publicId);
  }

  @Patch(':publicId/ativar')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar usuário' })
  @ApiParam({
    name: 'publicId',
    description: 'ID público do usuário (UUID v7)',
    example: '01234567-89ab-cdef-0123-456789abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário ativado com sucesso',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  activateUser(@Param('publicId') publicId: string): Promise<Usuario> {
    return this.usuariosService.activateUser(publicId);
  }

  @Post('initialize-system')
  @Public()
  @ApiOperation({
    summary: 'Inicializar sistema',
    description: 'Cria perfis padrão e usuário admin se não existirem',
  })
  @ApiResponse({
    status: 201,
    description: 'Sistema inicializado com sucesso',
  })
  async initializeSystem(): Promise<{ message: string }> {
    await this.usuariosService.initializeSystem();
    return { message: 'Sistema inicializado com sucesso' };
  }
}
