import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import i18next from 'i18next';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string): Promise<any> {
    // Validar se os parâmetros de entrada são válidos
    if (!email || !senha) {
      return null;
    }

    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    // Validar se o usuário existe e tem senha válida
    if (user && user.senha && typeof user.senha === 'string' && user.senha.length > 0) {
      try {
        const isPasswordValid = await bcrypt.compare(senha, user.senha);
        if (isPasswordValid) {
          const { senha: _, ...result } = user;
          return result;
        }
      } catch (error) {
        console.error('Erro ao comparar senhas:', error);
        return null;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.senha);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Verificar se o usuário possui pelo menos um parceiro ativo
    const parceirosAtivos = await this.getUserParceiros(user.id);
    if (!parceirosAtivos || parceirosAtivos.length === 0) {
      throw new UnauthorizedException(i18next.t('auth.noActivePartner'));
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '45m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH,
      expiresIn: '7d',
    });

    // Buscar perfil do usuário via UsuarioParceiro
    const usuarioParceiro = await this.prisma.usuarioParceiro.findFirst({
      where: { usuarioId: user.id },
      include: { perfil: true },
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        publicId: user.publicId,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        ativo: user.ativo,
        perfil: usuarioParceiro?.perfil
          ? {
              id: usuarioParceiro.perfil.id,
              nome: usuarioParceiro.perfil.nome,
            }
          : null,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH,
      });

      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });
      const usuarioParceiro = user
        ? await this.prisma.usuarioParceiro.findFirst({
            where: { usuarioId: user.id },
            include: { perfil: true },
          })
        : null;

      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '45m',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async getUserParceiros(userId: number): Promise<any[]> {
    const usuarioParceiros = await this.prisma.usuarioParceiro.findMany({
      where: { 
        usuarioId: userId,
        Parceiro: {
          ativo: true
        }
      },
      include: {
        Parceiro: {
          include: {
            currency: true,
          },
        },
        perfil: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return usuarioParceiros;
  }
}
