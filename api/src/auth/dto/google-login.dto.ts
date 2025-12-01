import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID Token retornado pelo Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU0NTMifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
