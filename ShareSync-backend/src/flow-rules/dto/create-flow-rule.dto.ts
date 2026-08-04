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
  FlowRuleActionType,
  FlowRuleConditionField,
  FlowRuleConditionOperator,
  FlowRuleTriggerType,
} from '../schemas/flow-rule.schema';

export class FlowRuleConditionDto {
  @IsEnum(FlowRuleConditionField)
  field: FlowRuleConditionField;

  @IsEnum(FlowRuleConditionOperator)
  operator: FlowRuleConditionOperator;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  value?: string;
}

export class FlowRuleActionDto {
  @IsEnum(FlowRuleActionType)
  type: FlowRuleActionType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class CreateFlowRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(FlowRuleTriggerType)
  triggerType: FlowRuleTriggerType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({
    each: true,
  })
  @Type(() => FlowRuleConditionDto)
  conditions?: FlowRuleConditionDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({
    each: true,
  })
  @Type(() => FlowRuleActionDto)
  actions: FlowRuleActionDto[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
