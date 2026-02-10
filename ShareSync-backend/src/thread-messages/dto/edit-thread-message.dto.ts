import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditThreadMessageDto {
  @ApiProperty({ description: 'Updated message content' })
  @IsString()
  content: string;
}
