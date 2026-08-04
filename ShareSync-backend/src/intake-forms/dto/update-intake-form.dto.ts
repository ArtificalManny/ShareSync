import {
  ApiProperty,
  PartialType,
} from '@nestjs/swagger';
import {
  IsBoolean,
} from 'class-validator';

import {
  CreateIntakeFormDto,
} from './create-intake-form.dto';

export class UpdateIntakeFormDto extends PartialType(
  CreateIntakeFormDto,
) {}

export class SetIntakeFormEnabledDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
