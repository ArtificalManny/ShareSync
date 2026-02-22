// src/subscriptions/dto/update-subscription.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// DTO for updating subscription settings
// ═══════════════════════════════════════════════════════════════════════════════

import { IsNumber, IsBoolean, IsOptional, IsObject, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBudgetCapDto {
  @ApiPropertyOptional({
    description: 'Maximum monthly budget in cents (e.g., 5000 = $50)',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  @Max(1000000) // $10,000 max
  @IsOptional()
  budgetCapCents?: number;

  @ApiPropertyOptional({
    description: 'Whether budget cap is enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  budgetCapEnabled?: boolean;
}

export class UpdateBillingDetailsDto {
  @ApiPropertyOptional({ example: 'Manny Rivas' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'billing@example.com' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'ShareSync Inc.' })
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Vancouver' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'BC' })
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'V6B 1A1' })
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'CA123456789' })
  @IsOptional()
  taxId?: string;
}
