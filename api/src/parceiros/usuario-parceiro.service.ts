import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioParceiroDto } from './dto/create-usuario-parceiro.dto';
import { UsuarioParceiro } from './entities/usuario-parceiro.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Parceiro } from './entities/parceiro.entity';

@Injectable()
export class UsuarioParceiroService {
  constructor(private prisma: PrismaService) {}

  private mapToUsuarioParceiroEntity(data: any): UsuarioParceiro {
    const usuarioParceiroEntity = new UsuarioParceiro({
      id: data.id,
      usuarioId: data.usuarioId,
      parceiroId: data.parceiroId,
      createdAt: data.createdAt,
    });

    if (data.Usuario) {
      usuarioParceiroEntity.Usuario = new Usuario({
        id: data.Usuario.id,
        publicId: data.Usuario.publicId,
        nome: data.Usuario.nome,
        email: data.Usuario.email,
        telefone: data.Usuario.telefone,
        provider: data.Usuario.provider,
        googleId: data.Usuario.googleId,
        senha: data.Usuario.senha,
        ativo: data.Usuario.ativo,
        avatar: data.Usuario.avatar,
        createdAt: data.Usuario.createdAt,
      });
    }

    if (data.Parceiro) {
      usuarioParceiroEntity.Parceiro = new Parceiro({
        id: data.Parceiro.id,
        publicId: data.Parceiro.publicId,
        nome: data.Parceiro.nome,
        ruccnpj: data.Parceiro.ruccnpj,
        email: data.Parceiro.email,
        redesocial: data.Parceiro.redesocial,
        telefone: data.Parceiro.telefone,

        ativo: data.Parceiro.ativo,
        logourl: data.Parceiro.logourl,
        thumburl: data.Parceiro.thumburl,
        createdAt: data.Parceiro.createdAt,
      });
    }

    return usuarioParceiroEntity;
  }

  async create(
    createUsuarioParceiroDto: CreateUsuarioParceiroDto,
  ): Promise<UsuarioParceiro> {
    // Verificar se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: createUsuarioParceiroDto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o parceiro existe
    const parceiro = await this.prisma.parceiro.findUnique({
      where: { id: createUsuarioParceiroDto.parceiroId },
    });
    if (!parceiro) {
      throw new NotFoundException('Parceiro não encontrado');
    }

    // Verificar se a relação já existe
    const existingRelation = await this.prisma.usuarioParceiro.findFirst({
      where: {
        usuarioId: createUsuarioParceiroDto.usuarioId,
        parceiroId: createUsuarioParceiroDto.parceiroId,
      },
    });

    if (existingRelation) {
      throw new ConflictException('Relação usuário-parceiro já existe');
    }

    // Criar instância da entidade com valores padrão
    const usuarioParceiroEntity = UsuarioParceiro.create(
      createUsuarioParceiroDto,
    );

    const usuarioParceiro = await this.prisma.usuarioParceiro.create({
      data: {
        usuarioId: usuarioParceiroEntity.usuarioId,
        parceiroId: usuarioParceiroEntity.parceiroId,
        perfilId: createUsuarioParceiroDto.perfilId, // agora perfilId está em UsuarioParceiro
      },
      include: {
        Usuario: true,
        Parceiro: true,
        perfil: true,
      },
    });

    return this.mapToUsuarioParceiroEntity(usuarioParceiro);
  }

  async findAll(): Promise<UsuarioParceiro[]> {
    const usuarioParceiros = await this.prisma.usuarioParceiro.findMany({
      include: {
        Usuario: true,
        Parceiro: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return usuarioParceiros.map(up => this.mapToUsuarioParceiroEntity(up));
  }

  async findOne(id: number): Promise<UsuarioParceiro> {
    const usuarioParceiro = await this.prisma.usuarioParceiro.findUnique({
      where: { id },
      include: {
        Usuario: true,
        Parceiro: true,
      },
    });
    if (!usuarioParceiro) {
      throw new NotFoundException('Relação usuário-parceiro não encontrada');
    }
    return this.mapToUsuarioParceiroEntity(usuarioParceiro);
  }

  async findByUsuario(usuarioId: number): Promise<UsuarioParceiro[]> {
    const usuarioParceiros = await this.prisma.usuarioParceiro.findMany({
      where: {
        usuarioId,
        Parceiro: {
          ativo: true,
        },
      },
      include: {
        Usuario: true,
        Parceiro: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return usuarioParceiros.map(up => this.mapToUsuarioParceiroEntity(up));
  }

  async findByParceiro(parceiroId: number): Promise<UsuarioParceiro[]> {
    const usuarioParceiros = await this.prisma.usuarioParceiro.findMany({
      where: { parceiroId },
      include: {
        Usuario: true,
        Parceiro: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return usuarioParceiros.map(up => this.mapToUsuarioParceiroEntity(up));
  }

  async remove(id: number): Promise<void> {
    // Verificar se a relação existe
    await this.findOne(id);

    await this.prisma.usuarioParceiro.delete({
      where: { id },
    });
  }

  async removeByUsuarioAndParceiro(
    usuarioId: number,
    parceiroId: number,
  ): Promise<void> {
    const usuarioParceiro = await this.prisma.usuarioParceiro.findFirst({
      where: {
        usuarioId,
        parceiroId,
      },
    });

    if (!usuarioParceiro) {
      throw new NotFoundException('Relação usuário-parceiro não encontrada');
    }

    await this.prisma.usuarioParceiro.delete({
      where: { id: usuarioParceiro.id },
    });
  }
}
