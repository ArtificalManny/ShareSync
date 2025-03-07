import React from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';

const ProjectsPage: React.FC = () => {
  const { projects, createProject, shareProject, addAnnouncement, addTask, likeAnnouncement, addAnnouncementComment, addTaskComment, updateTaskStatus } = useProjects();
  const { user } = useAuth();

  return (
    <div>
      <h1>My Projects</h1>
      <button onClick={() => createProject('New Project', 'Description')}>Create Project</button>
      {projects.map((project) => (
        <div key={project.id}>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
          <button onClick={() => shareProject(project.id, ['user1', 'user2'])}>Share</button>
          <button onClick={() => addAnnouncement(project.id, 'Announcement Content', 'media-url')}>Add Announcement</button>
          <button onClick={() => addTask(project.id, 'Task Title', 'Assignee', '2025-03-15', 'In Progress')}>Add Task</button>
          {/* Add rendering for announcements, tasks, etc. */}
        </div>
      ))}
    </div>
  );
};

export default ProjectsPage;