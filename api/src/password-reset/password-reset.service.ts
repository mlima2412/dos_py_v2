import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
const { nanoid } = require('nanoid');
import { Resend } from 'resend';
import { Usuario } from '../usuarios/entities/usuario.entity';
import i18next from 'i18next';

@Injectable()
export class PasswordResetService {
  constructor(private prisma: PrismaService) {}

  async requestPasswordReset(
    requestDto: RequestPasswordResetDto,
    lang: string,
  ): Promise<{ message: string }> {
    // Verificar se o usuário existe com o email fornecido
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: requestDto.email,
        ativo: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado ou inativo');
    }

    // Verificar se existe uma solicitação anterior válida (não expirada e não utilizada)
    const existingToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let token: string;

    if (existingToken) {
      // Se existe um token válido, reutilizar o mesmo
      token = existingToken.token;
    } else {
      // Criar novo token apenas se não existir um válido
      token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });
    }

    // Enviar email com o link de recuperação

    await this.sendPasswordResetEmail(user.email, user.nome, token, lang);

    return { message: 'Email de recuperação enviado com sucesso' };
  }

  async resetPassword(
    resetDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Buscar o token
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: resetDto.token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Criar instância da entidade Usuario para criptografar a senha
    const usuarioEntity = new Usuario(resetToken.user);
    await usuarioEntity.setPassword(resetDto.newPassword);

    // Atualizar a senha do usuário
    await this.prisma.usuario.update({
      where: { id: resetToken.userId },
      data: { senha: usuarioEntity.senha },
    });

    // Marcar o token como utilizado
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Invalidar todos os outros tokens do usuário
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        used: false,
        id: {
          not: resetToken.id,
        },
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  private async sendPasswordResetEmail(
    email: string,
    nome: string,
    token: string,
    lang,
  ): Promise<void> {
    const t = i18next.getFixedT(lang);

    const resend = new Resend(process.env.RESEND_API);

    // Determinar a URL base baseada no ambiente
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.COMPLETE_FRONTEND_URL
        : 'http://localhost:5173';

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    console.log('verificando o idioma');
    console.log(t('password-reset.subject'));
    // Obter traduções baseadas no idioma
    const subject = t('password-reset.subject');
    const title = t('password-reset.title');
    const greeting = t('password-reset.greeting', { name: nome });
    const message = t('password-reset.message');
    const buttonText = t('password-reset.buttonText');
    const important = t('password-reset.important');
    const validFor = t('password-reset.validFor');
    const notRequested = t('password-reset.notRequested');
    const doNotShare = t('password-reset.doNotShare');
    const fallbackText = t('password-reset.fallbackText');
    const footer = t('password-reset.footer');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">${title}</h2>
        
        <p>${greeting}</p>
        
        <p>${message}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        
        <p><strong>${important}</strong></p>
        <ul>
          <li>${validFor}</li>
          <li>${notRequested}</li>
          <li>${doNotShare}</li>
        </ul>
        
        <p>${fallbackText}</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          ${footer}
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'noreply@dos.com.py',
      to: email,
      subject: subject,
      html: emailHtml,
    });
  }

  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return { valid: false, message: 'Token inválido ou expirado' };
    }

    return { valid: true };
  }
}
