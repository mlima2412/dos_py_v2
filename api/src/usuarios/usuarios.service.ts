import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { ensureSystemInitialized } from './ipl';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<any> {
    // Verificar se o email já existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar instância da entidade Usuario com geração automática de UUID
    const usuarioEntity = Usuario.create({
      nome: createUsuarioDto.nome,
      email: createUsuarioDto.email,
      telefone: createUsuarioDto.telefone,
      provider: createUsuarioDto.provider,
      googleId: createUsuarioDto.googleId,
      ativo: createUsuarioDto.ativo,
      avatar: createUsuarioDto.avatar,
    });

    // Criptografar a senha se fornecida na criação do usuário
    await usuarioEntity.setPassword(process.env.DEFAULT_USER_PASSWORD);

    const usuario = await this.prisma.usuario.create({
      data: {
        publicId: usuarioEntity.publicId,
        nome: usuarioEntity.nome,
        email: usuarioEntity.email,
        telefone: usuarioEntity.telefone,
        provider: usuarioEntity.provider,
        googleId: usuarioEntity.googleId,
        senha: usuarioEntity.senha,
        ativo: usuarioEntity.ativo,
        avatar: usuarioEntity.avatar,
      },
    });

    return usuario;
  }

  async findAll(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        publicId: true,
        nome: true,
        email: true,
        telefone: true,
        provider: true,
        googleId: true,
        ativo: true,
        avatar: true,
        createdAt: true,
        // senha: false - excluída por segurança
      },
    });
    return usuarios as Usuario[];
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    organizacao?: string;
    perfil?: number;
    ativo?: boolean;
  }) {
    const { page, limit, search, organizacao, perfil, ativo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    const andConditions: any[] = [];

    // Filtro de busca (nome, email, parceiros)
    if (search) {
      andConditions.push({
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          {
            UsuarioParceiro: {
              some: {
                Parceiro: {
                  nome: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      });
    }

    // Filtro por organização/parceiro
    if (organizacao) {
      andConditions.push({
        UsuarioParceiro: {
          some: {
            Parceiro: {
              nome: { contains: organizacao, mode: 'insensitive' },
            },
          },
        },
      });
    }

    // Filtro por perfil
    // (Filtro de perfil deve ser feito via UsuarioParceiro/perfilId agora)
    // Exemplo: andConditions.push({ UsuarioParceiro: { some: { perfilId: perfil } } });
    if (perfil !== undefined) {
      andConditions.push({ UsuarioParceiro: { some: { perfilId: perfil } } });
    }

    // Filtro por status ativo
    if (ativo !== undefined) {
      andConditions.push({ ativo: ativo });
    }

    // Aplicar condições AND se houver filtros
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Buscar dados com paginação
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          publicId: true,
          nome: true,
          email: true,
          telefone: true,
          provider: true,
          googleId: true,
          ativo: true,
          avatar: true,
          createdAt: true,
          UsuarioParceiro: {
            select: {
              id: true,
              perfilId: true,
              Parceiro: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              perfil: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: usuarios,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(publicId: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { publicId },
      select: {
        id: true,
        publicId: true,
        nome: true,
        email: true,
        telefone: true,
        provider: true,
        googleId: true,
        ativo: true,
        avatar: true,
        createdAt: true,
        UsuarioParceiro: {
          select: {
            id: true,
            perfilId: true,
            Parceiro: {
              select: {
                id: true,
                publicId: true,
                nome: true,
              },
            },
            perfil: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        // senha: false - excluída por segurança
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async findByEmail(email: string): Promise<any | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });
    return usuario;
  }

  async update(
    publicId: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<any> {
    // Verificar se o usuário existe
    const existingUser = await this.findOne(publicId);

    // Se está tentando atualizar o email, verificar se não está em uso
    if (
      updateUsuarioDto.email &&
      updateUsuarioDto.email !== existingUser.email
    ) {
      const emailInUse = await this.prisma.usuario.findUnique({
        where: { email: updateUsuarioDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData = { ...updateUsuarioDto };
    delete updateData.publicId; // Não permitir atualização do publicId

    // Criptografar a senha se fornecida
    if (updateUsuarioDto.senha) {
      const usuarioEntity = Usuario.create(existingUser);
      await usuarioEntity.setPassword(updateUsuarioDto.senha);
      updateData.senha = usuarioEntity.senha;
    }

    const usuario = await this.prisma.usuario.update({
      where: { publicId },
      data: updateData,
    });

    return usuario;
  }

  async findActiveUsers(): Promise<any[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        publicId: true,
        nome: true,
        email: true,
        telefone: true,
        provider: true,
        googleId: true,
        ativo: true,
        avatar: true,
        createdAt: true,
        // senha: false - excluída por segurança
      },
    });
    return usuarios;
  }

  async deactivateUser(publicId: string): Promise<Usuario> {
    // const resend = new Resend(process.env.RESEND_API);
    // const usuario = await this.findOne(publicId);
    // await resend.emails.send({
    //   from: 'admin@dos.com.py',
    //   to: 'mlima001@gmail.com',
    //   subject: 'Sua conta foi desativada',
    //   html: '<p>Seu acesso foi desativado. Se você não fez isso, entre em contato conosco.</p>',
    // });
    return this.update(publicId, { ativo: false });
  }

  async activateUser(publicId: string): Promise<Usuario> {
    return this.update(publicId, { ativo: true });
  }

  /**
   * Inicializa o sistema criando perfis e usuário admin padrão se não existirem
   */
  async initializeSystem(): Promise<void> {
    await ensureSystemInitialized(this.prisma);
  }
}
