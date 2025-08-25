import { PartialType } from '@nestjs/swagger';
import { CreateContasPagarParcelasDto } from './create-contas-pagar-parcelas.dto';

export class UpdateContasPagarParcelasDto extends PartialType(
  CreateContasPagarParcelasDto,
) {}
