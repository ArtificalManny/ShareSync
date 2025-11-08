// src/pages/Projects.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectListItem from "../components/projects/ProjectListItem.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProjectsCreate from "./ProjectsCreate.jsx";
import Page from "../components/layout/Page.jsx";
import { listProjects } from "../api/projects";
import { toast } from "../components/ui/toast.jsx";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listProjects();
        if (!ignore) setProjects(data || []);
      } catch (e) {
        toast({ title: "Failed to load projects", variant: "error" });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, []);

  const handleCreated = (newProject) => {
    setProjects((p) => [newProject, ...p]);
    setShowCreate(false);
    toast({ title: "Project created!", variant: "success" });
    navigate(`/projects/${newProject._id}`);
  };

  return (
    <Page>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <button onClick={() => setShowCreate(true)} className="btn btn--primary flex items-center gap-2">
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-surface rounded-2xl" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon="FolderKanban"
            title="No projects yet"
            primary={{ label: "+ New Project", onClick: () => setShowCreate(true) }}
          >
            Start building something amazing.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((p) => (
              <ProjectListItem
                key={p._id}
                project={p}
                onClick={(id) => navigate(`/projects/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <ProjectsCreate
          onClose={() => setShowCreate(false)}
          onProjectCreated={handleCreated}
        />
      )}
    </Page>
  );
}