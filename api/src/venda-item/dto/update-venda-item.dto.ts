import { PartialType } from '@nestjs/swagger';
import { CreateVendaItemDto } from './create-venda-item.dto';

export class UpdateVendaItemDto extends PartialType(CreateVendaItemDto) {}
