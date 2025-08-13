import { PartialType } from '@nestjs/swagger';
import { CreateDespesaSwaggerDto } from './create-despesa-swagger.dto';

export class UpdateDespesaSwaggerDto extends PartialType(CreateDespesaSwaggerDto) {}