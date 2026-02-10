// src/milestones/dto/link-task.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class LinkTaskDto {
  @ApiProperty({ description: 'Task ID to link (Mongo ObjectId)' })
  @IsMongoId()
  taskId: string;
}
