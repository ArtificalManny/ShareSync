// src/subscriptions/dto/create-checkout.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DTO for creating Stripe checkout sessions
// ═══════════════════════════════════════════════════════════════════════════════

import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CheckoutPlan {
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

export enum CheckoutInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class CreateCheckoutDto {
  @ApiProperty({
    enum: CheckoutPlan,
    description: 'Plan to subscribe to',
    example: 'team',
  })
  @IsEnum(CheckoutPlan)
  plan: CheckoutPlan;

  @ApiPropertyOptional({
    enum: CheckoutInterval,
    description: 'Billing interval (monthly or yearly)',
    example: 'monthly',
    default: 'monthly',
  })
  @IsEnum(CheckoutInterval)
  @IsOptional()
  interval?: CheckoutInterval = CheckoutInterval.MONTHLY;

  @ApiPropertyOptional({
    description: 'Success redirect URL',
  })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Cancel redirect URL',
  })
  @IsString()
  @IsOptional()
  cancelUrl?: string;
}
