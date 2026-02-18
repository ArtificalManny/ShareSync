// src/context/ProjectContext.tsx
// ⭐ FIX: Added validation for projectId to prevent undefined issues
import React, { createContext, useContext, useState, useMemo } from "react";
import useSocket from "../hooks/useSocket";

export type ProjectContextValue = {
  project: any;
  setProject: React.Dispatch<React.SetStateAction<any>>;
  projectId: string | null;
  hasValidId: boolean;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

/**
 * Safely extract project ID from various sources
 */
function safeGetProjectId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id === "undefined" || id === "null") return null;
  return String(id);
}

export function ProjectProvider({
  projectId: rawProjectId,
  initialProject,
  children,
}: {
  projectId?: string | null;
  initialProject?: any;
  children: React.ReactNode;
}) {
  // ⭐ FIX: Validate projectId before using
  const projectId = safeGetProjectId(rawProjectId);
  const hasValidId = projectId !== null;

  const [project, setProject] = useState<any>(() => {
    if (!initialProject) return null;

    // Normalize initial project to ensure id exists
    const id = initialProject._id || initialProject.id;
    if (!id) return initialProject;

    return {
      ...initialProject,
      id: String(id),
      _id: String(id),
    };
  });

  // ✅ IMPORTANT: useSocket expects string[] (not string|null)
  const initialRooms = useMemo(() => {
    if (!hasValidId || !projectId) return [];
    return [`project:${projectId}`];
  }, [hasValidId, projectId]);

  // Only connect to socket if we have a valid project ID
  useSocket(initialRooms, {
    enabled: hasValidId,
    onEvents: {
      "project:membersUpdated": (payload: any) => {
        if (!hasValidId) return;
        if (String(payload?.projectId) !== projectId) return;
        setProject((p: any) => ({
          ...(p || {}),
          members: payload.members || [],
          invites: payload.invites || (p?.invites || []),
        }));
      },
      "project:updated": (payload: any) => {
        if (!hasValidId) return;
        if (String(payload?.projectId) !== projectId) return;
        setProject((p: any) => ({
          ...(p || {}),
          ...payload.project,
        }));
      },
    },
  });

  // Memoize context value
  const value = useMemo(
    () => ({
      project,
      setProject,
      projectId,
      hasValidId,
    }),
    [project, projectId, hasValidId]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    // ⭐ FIX: Return safe fallback instead of throwing
    // This allows components to check hasValidId
    console.warn("[useProject] Used outside of ProjectProvider - returning fallback");
    return {
      project: null,
      setProject: () => {},
      projectId: null,
      hasValidId: false,
    };
  }
  return ctx;
}

/**
 * Hook to get just the project ID (safe version)
 */
export function useProjectId(): string | null {
  const { projectId } = useProject();
  return projectId;
}

/**
 * Hook to check if we have a valid project context
 */
export function useHasValidProject(): boolean {
  const { hasValidId, project } = useProject();
  return hasValidId && project !== null;
}

export default ProjectProvider;
