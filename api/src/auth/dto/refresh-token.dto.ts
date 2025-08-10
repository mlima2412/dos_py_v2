import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token deve ser uma string' })
  refreshToken: string;
}