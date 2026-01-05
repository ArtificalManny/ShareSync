// src/invitations/dto/create-invitation.dto.ts
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(['member', 'admin'])
  role: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
