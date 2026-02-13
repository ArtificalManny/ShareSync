// src/context/ProjectContext.tsx
import React, { createContext, useContext, useState } from "react";
import useSocket from "../hooks/useSocket";

export type ProjectContextValue = {
  project: any;
  setProject: React.Dispatch<React.SetStateAction<any>>;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  projectId,
  initialProject,
  children,
}: {
  projectId?: string | null;
  initialProject?: any;
  children: React.ReactNode;
}) {
  const [project, setProject] = useState<any>(initialProject || null);

  useSocket(projectId ? `project:${projectId}` : null, {
    onEvents: {
      "project:membersUpdated": (payload: any) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        setProject((p: any) => ({
          ...(p || {}),
          members: payload.members || [],
          invites: payload.invites || (p?.invites || []),
        }));
      },
    },
  });

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a ProjectProvider");
  return ctx;
}
