// src/activities/dto/create-activity.dto.ts
export type AnyObj = Record<string, any>;

export interface CreateActivityDto {
  projectId: string;
  type?: string;  // e.g., 'update' | 'task'
  text?: string;
  meta?: AnyObj;
}
