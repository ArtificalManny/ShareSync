import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class RespondToEventDto {
  @ApiProperty({ description: 'Invitation response', enum: ['accepted', 'declined', 'tentative'] })
  @IsIn(['accepted', 'declined', 'tentative'])
  response: 'accepted' | 'declined' | 'tentative';
}
