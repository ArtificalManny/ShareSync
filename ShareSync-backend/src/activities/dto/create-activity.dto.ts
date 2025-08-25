// src/activities/dto/create-activity.dto.ts
export class CreateActivityDto {
  projectId!: string;
  type?: string;           // e.g., 'update' | 'task.create' | ...
  text?: string;           // message
  meta?: Record<string, any>;
  entityId?: string;
  entityType?: string;
  // Optional snapshots (if you have them handy)
  user?: { id: string; name?: string; avatarUrl?: string };
  project?: { id: string; title?: string };
}
