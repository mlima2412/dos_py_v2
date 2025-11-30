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
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserParceiroItemDto } from './dto/user-parceiro-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TFunction } from 'i18next';

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
          email: 'mlima001@gmail.com',
          senha: '123456',
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
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request & { language: string; t: TFunction },
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);
    console.log(req.t('main.greeting'));
    // Configurar cookie para aplicação web (7 dias)
    const isProduction = process.env.NODE_ENV === 'production';
    let cookieDomain: string | undefined;

    if (isProduction && process.env.FRONTEND_URL) {
      try {
        cookieDomain = new URL(process.env.FRONTEND_URL).hostname;
      } catch {
        cookieDomain = process.env.FRONTEND_URL;
      }
    }

    response.cookie('refreshToken', result.refreshToken, {
      domain: cookieDomain,
      httpOnly: true,
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
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
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req): Promise<RefreshResponseDto> {
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
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    type: LogoutResponseDto,
  })
  async logout(@Res({ passthrough: true }) response: Response): Promise<LogoutResponseDto> {
    const isProduction = process.env.NODE_ENV === 'production';
    let cookieDomain: string | undefined;

    if (isProduction && process.env.FRONTEND_URL) {
      try {
        cookieDomain = new URL(process.env.FRONTEND_URL).hostname;
      } catch {
        cookieDomain = process.env.FRONTEND_URL;
      }
    }

    // Limpar cookie do refresh token
    response.clearCookie('refreshToken', {
      domain: cookieDomain,
      httpOnly: true,
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    return { message: 'Logout realizado com sucesso' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    type: UserProfileDto,
  })
  async getProfile(@Request() req): Promise<UserProfileDto> {
    return req.user;
  }

  @Get('me/parceiros')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter parceiros do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de parceiros do usuário',
    type: [UserParceiroItemDto],
  })
  async getUserParceiros(@Request() req): Promise<UserParceiroItemDto[]> {
    return this.authService.getUserParceiros(req.user.id);
  }
}
