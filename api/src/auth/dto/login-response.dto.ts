export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    publicId: string;
    nome: string;
    email: string;
    telefone?: string;
    ativo: boolean;
    perfil: {
      id: number;
      nome: string;
    };
  };
}