import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  FlowRuleActionDto,
  FlowRuleConditionDto,
} from './create-flow-rule.dto';

import {
  FlowRuleTriggerType,
} from '../schemas/flow-rule.schema';

export class UpdateFlowRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(FlowRuleTriggerType)
  triggerType?: FlowRuleTriggerType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({
    each: true,
  })
  @Type(() => FlowRuleConditionDto)
  conditions?: FlowRuleConditionDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({
    each: true,
  })
  @Type(() => FlowRuleActionDto)
  actions?: FlowRuleActionDto[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SetFlowRuleEnabledDto {
  @IsBoolean()
  enabled: boolean;
}
