// src/utils/projectHelpers.d.ts
// ----------------------------------------------------------------------------
// Type declarations for src/utils/projectHelpers.js
// This is a TS shim so TS files can import the JS helpers safely.
// Keep runtime implementation in projectHelpers.js.
// ----------------------------------------------------------------------------

export type IdLike =
  | string
  | null
  | undefined
  | { _id?: string; id?: string; projectId?: string }
  | Record<string, any>;

export type NavigateFn = (path: string) => void;

export function getProjectId(input: IdLike): string | null;
export function hasValidProjectId(input: IdLike): boolean;

export function getProjectPath(projectId: string): string;

export function navigateToProject(
  navigate: NavigateFn,
  projectIdOrObj: IdLike,
  fallbackPath?: string
): void;

export function normalizeProject<T = any>(project: T): T;
export function normalizeProjects<T = any>(projects: T[]): T[];

