import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  PasswordResetMessageResponseDto,
  ValidateTokenResponseDto,
} from './dto/password-reset-message-response.dto';
import { Public } from '../auth/decorators/public.decorator';

import { TFunction } from 'i18next';

@ApiTags('password-reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Public()
  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado com sucesso',
    type: PasswordResetMessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado ou inativo',
  })
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetDto,
    @Req() req: Request & { language: string; t: TFunction },
  ) {
    const lang = req.language || 'pt';
    return this.passwordResetService.requestPasswordReset(requestDto, lang);
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    type: PasswordResetMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(resetDto);
  }

  @Public()
  @Get('validate-token')
  @ApiOperation({ summary: 'Validar token de recuperação' })
  @ApiQuery({
    name: 'token',
    description: 'Token de recuperação de senha',
    example: 'abc123def456ghi789jkl012mno345pqr678',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de validação do token',
    type: ValidateTokenResponseDto,
  })
  async validateToken(@Query('token') token: string) {
    return this.passwordResetService.validateToken(token);
  }
}
