// src/invitations/dto/accept-invitation.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
