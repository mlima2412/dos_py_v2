import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TFunction } from 'i18next'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Login como Admin',
        description: 'Exemplo de login com usuário administrador',
        value: {
          email: 'admin@email.com',
          senha: 'admin123',
        },
      },
      usuario: {
        summary: 'Login como Usuário',
        description: 'Exemplo de login com usuário comum',
        value: {
          email: 'usuario@exemplo.com',
          senha: 'senha123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            publicId: {
              type: 'string',
              example: '01234567-89ab-cdef-0123-456789abcdef',
            },
            nome: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@exemplo.com' },
            telefone: { type: 'string', example: '(11) 99999-9999' },
            ativo: { type: 'boolean', example: true },
            perfil: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                nome: { type: 'string', example: 'Admin' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request & { language: string; t: TFunction }
  ) {
    const result = await this.authService.login(loginDto);
    console.log(req.t('main.greeting'))
    // Configurar cookie para aplicação web (7 dias)
    response.cookie('refreshToken', result.refreshToken, {
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : 'localhost',
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      refresh: {
        summary: 'Renovar Token',
        description: 'Exemplo de renovação de token de acesso',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req) {
    // Priorizar refresh token do body (mobile) ou cookie (web)
    const refreshToken =
      refreshTokenDto.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token não fornecido');
    }

    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar logout' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Res({ passthrough: true }) response: Response) {
    // Limpar cookie do refresh token
    response.clearCookie('refreshToken');

    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get('me/parceiros')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter parceiros do usuário logado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de parceiros do usuário',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          parceiroId: { type: 'number', example: 1 },
          Parceiro: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              publicId: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
              nome: { type: 'string', example: 'Parceiro Exemplo' },
              logourl: { type: 'string', example: 'https://exemplo.com/logo.png' }
            }
          },
          perfil: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              nome: { type: 'string', example: 'Admin' }
            }
          }
        }
      }
    }
  })
  async getUserParceiros(@Request() req) {
    return this.authService.getUserParceiros(req.user.id);
  }
}
