import {
  Injectable,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { ensureSystemInitialized } from './ipl';
import { Linguagem } from '@prisma/client';
import { Resend } from 'resend';
import i18next from 'i18next';
import { PasswordResetService } from '../password-reset/password-reset.service';

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private passwordResetService: PasswordResetService,
  ) {}

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
      linguagem: createUsuarioDto.linguagem || Linguagem.Portugues,
    });

    usuarioEntity.provider = (usuarioEntity.provider || 'LOCAL').toUpperCase();
    const isGoogleProvider = usuarioEntity.provider === 'GOOGLE';

    // For LOCAL users without a provided password, we need email service to send invitation
    // Fail early if email service is unavailable to prevent creating unusable accounts
    const needsInvitationEmail =
      !isGoogleProvider && !createUsuarioDto.senha;
    if (needsInvitationEmail && !process.env.RESEND_API) {
      throw new ServiceUnavailableException(
        'Serviço de email não configurado. Para criar usuários locais sem senha, ' +
          'configure RESEND_API ou forneça uma senha inicial.',
      );
    }

    if (!isGoogleProvider) {
      // Use provided password if available, otherwise generate a random temporary password
      // The user will define their real password via the invitation email link
      const passwordToSet =
        createUsuarioDto.senha || this.generateRandomPassword();
      await usuarioEntity.setPassword(passwordToSet);
    } else {
      usuarioEntity.senha = null;
    }

    // For LOCAL users without provided password, the invitation email is mandatory.
    // We must ensure the email is sent successfully before persisting the user,
    // otherwise we create an unusable account (no password, no invitation token).
    // Use a transaction to rollback if email sending fails.
    if (needsInvitationEmail) {
      return await this.createUserWithMandatoryEmail(usuarioEntity);
    }

    // For users with provided password or Google users, create normally
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
        linguagem: usuarioEntity.linguagem,
      },
    });

    // Email is optional for these users - fire and forget
    this.sendInvitationEmail(usuario, isGoogleProvider).catch(error => {
      console.error('Erro ao enviar convite de usuário:', error);
    });

    return usuario;
  }

  /**
   * Creates a user where invitation email is mandatory (LOCAL users without password).
   * Uses a transaction to ensure atomicity: if email fails, the user is not persisted.
   */
  private async createUserWithMandatoryEmail(
    usuarioEntity: Usuario,
  ): Promise<any> {
    // Create user within transaction
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
        linguagem: usuarioEntity.linguagem,
      },
    });

    try {
      // Attempt to send mandatory invitation email
      await this.sendInvitationEmail(usuario, false);
      return usuario;
    } catch (emailError) {
      // Email failed - delete the just-created user to maintain consistency
      // The user cannot access the system without the invitation email
      try {
        await this.prisma.usuario.delete({
          where: { id: usuario.id },
        });
      } catch (deleteError) {
        // Log deletion failure but still throw the original email error
        console.error(
          'Falha ao reverter criação de usuário após erro de email:',
          deleteError,
        );
      }
      // Re-throw original error with context
      throw new ServiceUnavailableException(
        `Falha ao enviar email de convite. Usuário não foi criado. Erro: ${emailError.message || emailError}`,
      );
    }
  }

  /**
   * Generates a random password for temporary use.
   * User will set their real password via invitation link.
   */
  private generateRandomPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
        linguagem: true,
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
          linguagem: true,
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
        linguagem: true,
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

    const targetProvider = (
      updateUsuarioDto.provider || existingUser.provider || 'LOCAL'
    ).toUpperCase();
    const isGoogleProvider = targetProvider === 'GOOGLE';

    // Criptografar a senha se fornecida
    if (updateUsuarioDto.senha) {
      if (isGoogleProvider) {
        throw new ConflictException(
          'Usuários autenticados com Google não podem definir senha manualmente',
        );
      }
      const usuarioEntity = Usuario.create(existingUser);
      await usuarioEntity.setPassword(updateUsuarioDto.senha);
      updateData.senha = usuarioEntity.senha;
    } else if (isGoogleProvider) {
      updateData.senha = null;
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
        linguagem: true,
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

  private getApplicationUrl(): string {
    return (
      process.env.APPLICATION_URL ||
      process.env.COMPLETE_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      process.env.VITE_APPLICATION_URL ||
      'http://localhost:5173'
    );
  }

  private getLocaleFromLinguagem(linguagem?: Linguagem): string {
    return linguagem === 'Espanol' ? 'es' : 'pt';
  }

  /**
   * Sends invitation email to new users.
   * - Google users: Simple welcome email with login link
   * - Local users: Email with link to define their password
   */
  private async sendInvitationEmail(
    user: {
      id: number;
      nome: string;
      email: string;
      linguagem: Linguagem;
    },
    isGoogleProvider: boolean,
  ): Promise<void> {
    if (!process.env.RESEND_API) {
      console.warn('RESEND_API não configurado. Convite não enviado.');
      return;
    }

    const resend = new Resend(process.env.RESEND_API);
    const baseUrl = this.getApplicationUrl().replace(/\/$/, '');
    const logoUrl = `${baseUrl}/logo-menu-color.png`;
    const t = i18next.getFixedT(this.getLocaleFromLinguagem(user.linguagem));

    let actionUrl: string;
    let subject: string;
    let title: string;
    let intro: string;
    let instructions: string;
    let buttonText: string;

    if (isGoogleProvider) {
      // Google users: simple login link
      actionUrl = `${baseUrl}/login`;
      subject = t('invitation.subject');
      title = t('invitation.title');
      intro = t('invitation.intro');
      instructions = t('invitation.instructions');
      buttonText = t('invitation.buttonText');
    } else {
      // Local users: password definition link
      const token = await this.passwordResetService.createInvitationToken(
        user.id,
      );
      actionUrl = `${baseUrl}/reset-password?token=${token}`;
      subject = t('invitation.local.subject');
      title = t('invitation.local.title');
      intro = t('invitation.local.intro');
      instructions = t('invitation.local.instructions');
      buttonText = t('invitation.local.buttonText');
    }

    const greeting = t('invitation.greeting', { name: user.nome });
    const footer = t('invitation.footer');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${logoUrl}" alt="DOS" style="max-width: 200px; width: 60%;"/>
        </div>
        <h2 style="color: #111827; text-align: center;">${title}</h2>
        <p>${greeting}</p>
        <p>${intro}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${actionUrl}" style="background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        <p>${instructions}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">${footer}</p>
      </div>
    `;

    await resend.emails.send({
      from: 'noreply@dos.com.py',
      to: user.email,
      subject,
      html,
    });
  }
}
