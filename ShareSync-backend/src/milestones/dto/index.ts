// src/milestones/dto/index.ts
// Barrel exports so existing imports like:
//   import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';
// continue to work.

export * from './create-milestone.dto';
export * from './update-milestone.dto';

// Optional: keep a dedicated DTO for linking tasks (if/when you want to use it in controller)
export * from './link-task.dto';
