// src/tasks/dto/complete-task.dto.ts
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CompleteTaskDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  actualTime?: number; // Actual time spent (minutes)
}