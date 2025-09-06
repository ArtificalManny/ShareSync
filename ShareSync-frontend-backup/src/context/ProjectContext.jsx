// /src/context/ProjectContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

const ProjectContext = createContext(null);

export function ProjectProvider({ projectId, initialProject, children }) {
  const [project, setProject] = useState(initialProject || null);

  useSocket(projectId ? `project:${projectId}` : null, {
    onEvents: {
      "project:membersUpdated": (payload) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        setProject((p) => ({ ...(p || {}), members: payload.members || [] }));
      },
    },
  });

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}