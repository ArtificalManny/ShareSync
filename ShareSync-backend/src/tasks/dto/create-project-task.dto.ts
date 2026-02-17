// src/tasks/dto/create-project-task.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PROJECT TASK DTO
// A "project-scoped" DTO: CreateTaskDto minus projectId.
// Project association must come ONLY from the URL (:projectId), never the body.
// ═══════════════════════════════════════════════════════════════════════════════

import { OmitType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

export class CreateProjectTaskDto extends OmitType(CreateTaskDto, [
  'projectId',
] as const) {}
