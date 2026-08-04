import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  Type,
} from 'class-transformer';

import {
  IntakeFieldType,
} from '../schemas/intake-form.schema';

export class IntakeFormFieldDto {
  @ApiPropertyOptional({
    description:
      'Stable field identifier. Generated when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @ApiProperty({
    enum: IntakeFieldType,
  })
  @IsEnum(IntakeFieldType)
  type: IntakeFieldType;

  @ApiProperty({
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  label: string;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  placeholder?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Required only for dropdown fields.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({
    each: true,
  })
  @MaxLength(200, {
    each: true,
  })
  options?: string[];
}

export class CreateIntakeFormDto {
  @ApiProperty({
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    type: [IntakeFormFieldDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({
    each: true,
  })
  @Type(() => IntakeFormFieldDto)
  fields: IntakeFormFieldDto[];

  @ApiPropertyOptional({
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  successMessage?: string;
}
