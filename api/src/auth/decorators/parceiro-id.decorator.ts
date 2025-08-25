import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const ParceiroId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const parceiroId = request.headers['x-parceiro-id'];

    if (!parceiroId) {
      throw new BadRequestException('Header x-parceiro-id é obrigatório');
    }

    const parceiroIdNumber = parseInt(parceiroId, 10);

    if (isNaN(parceiroIdNumber) || parceiroIdNumber <= 0) {
      throw new BadRequestException(
        'Header x-parceiro-id deve ser um número válido',
      );
    }

    return parceiroIdNumber;
  },
);
