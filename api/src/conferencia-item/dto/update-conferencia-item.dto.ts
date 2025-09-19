import { PartialType } from '@nestjs/swagger';
import { CreateConferenciaItemDto } from './create-conferencia-item.dto';

export class UpdateConferenciaItemDto extends PartialType(CreateConferenciaItemDto) {}
