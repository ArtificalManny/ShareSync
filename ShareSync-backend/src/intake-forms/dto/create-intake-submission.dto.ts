import {
  ApiProperty,
} from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  Type,
} from 'class-transformer';

export class IntakeAnswerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  fieldId: string;

  @ApiProperty({
    description:
      'Answer value. Its type is validated against the form field.',
  })
  @IsDefined()
  value: unknown;
}

export class CreateIntakeSubmissionDto {
  @ApiProperty({
    type: [IntakeAnswerDto],
  })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({
    each: true,
  })
  @Type(() => IntakeAnswerDto)
  answers: IntakeAnswerDto[];
}
