import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
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

    return {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
      avatar: user.avatar,
      perfil: usuarioParceiro?.perfil
        ? {
            id: usuarioParceiro.perfil.id,
            nome: usuarioParceiro.perfil.nome,
          }
        : null,
    };
  }
}