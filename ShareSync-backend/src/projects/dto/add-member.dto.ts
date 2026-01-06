// src/projects/dto/add-member.dto.ts
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['member', 'admin'])
  @IsNotEmpty()
  role: string;
}