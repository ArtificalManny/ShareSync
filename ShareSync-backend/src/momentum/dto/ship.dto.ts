// src/momentum/dto/ship.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class ShipProjectDto {
  @IsString()
  @IsOptional()
  note?: string;
}