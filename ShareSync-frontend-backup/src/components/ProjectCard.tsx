import React from 'react';
import { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  onShare?: () => void;
  onAddAnnouncement?: () => void;
  onAddTask?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onShare, onAddAnnouncement, onAddTask }) => {
  return (
    <div className="p-4 bg-white rounded shadow mb-4">
      <h3 className="text-lg font-bold">{project.name}</h3>
      <p className="text-gray-700">{project.description}</p>
      <p className="text-gray-500">Admin: {project.admin}</p>
      <p className="text-gray-500">Shared With: {project.sharedWith.join(', ') || 'None'}</p>
      {onShare && <button onClick={onShare} className="mt-2 py-1 px-3 bg-green-500 text-white rounded hover:bg-green-600">Share</button>}
      {onAddAnnouncement && <button onClick={onAddAnnouncement} className="mt-2 py-1 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 ml-2">Add Announcement</button>}
      {onAddTask && <button onClick={onAddTask} className="mt-2 py-1 px-3 bg-purple-500 text-white rounded hover:bg-purple-600 ml-2">Add Task</button>}
    </div>
  );
};

export default ProjectCard;