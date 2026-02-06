// src/projects/dto/project-member.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT MEMBER DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsEmail,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { MemberRole } from '../schemas/project.schema';

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Role to assign',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole;
}

export class InviteMemberByEmailDto {
  @ApiProperty({
    description: 'Email address to invite',
    example: 'teammate@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Role to assign',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole;

  @ApiPropertyOptional({
    description: 'Personal message for invite',
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role',
    enum: MemberRole,
  })
  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;
}

export class ProjectMemberResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty({ enum: MemberRole })
  role: MemberRole;

  @ApiProperty()
  joinedAt: Date;
}
