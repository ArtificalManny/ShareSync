import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import Announcement from '../components/Announcement';
import Task from '../components/Task';
import { socket } from '../services/socket';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { projects, createProject, shareProject, addAnnouncement, addTask, likeAnnouncement, addAnnouncementComment, addTaskComment, updateTaskStatus } = useProjects();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [shareUsers, setShareUsers] = useState<string[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ content: '', media: '' });
  const [newTask, setNewTask] = useState({ title: '', assignee: '', dueDate: '', status: 'Pending' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    socket.on('newAnnouncement', (data: any) => {
      console.log('New announcement received:', data);
    });
    socket.on('newTask', (data: any) => {
      console.log('New task received:', data);
    });

    return () => {
      socket.off('newAnnouncement');
      socket.off('newTask');
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject(newProject);
    setNewProject({ name: '', description: '' });
  };

  const handleShareProject = async (projectId: number) => {
    await shareProject(projectId.toString(), [user?.username || ''], shareUsers);
    setShareUsers([]);
  };

  const handleAddAnnouncement = async (projectId: number) => {
    await addAnnouncement(projectId.toString(), { content: newAnnouncement.content, media: newAnnouncement.media });
    setNewAnnouncement({ content: '', media: '' });
  };

  const handleAddTask = async (projectId: number) => {
    await addTask(projectId.toString(), { title: newTask.title, assignee: newTask.assignee, dueDate: newTask.dueDate, status: newTask.status });
    setNewTask({ title: '', assignee: '', dueDate: '', status: 'Pending' });
  };

  const handleLikeAnnouncement = async (projectId: number, annId: number) => {
    await likeAnnouncement(projectId.toString(), annId);
  };

  const handleAddAnnouncementComment = async (projectId: number, annId: number, text: string) => {
    await addAnnouncementComment(projectId.toString(), annId, text);
  };

  const handleAddTaskComment = async (projectId: number, taskId: number, text: string) => {
    await addTaskComment(projectId.toString(), taskId, text);
  };

  const handleUpdateTaskStatus = async (projectId: number, taskId: number, status: string) => {
    await updateTaskStatus(projectId.toString(), taskId, status);
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <form onSubmit={handleCreateProject} className="mb-6 max-w-md">
        <input
          type="text"
          value={newProject.name}
          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          placeholder="Project Name"
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <textarea
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          placeholder="Description"
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">Create Project</button>
      </form>
      {projects.map((project) => (
        <div key={project.id} className="mb-6">
          <ProjectCard
            project={project}
            onShare={() => setSelectedProject(project.id)}
            onAddAnnouncement={() => setSelectedProject(project.id)}
            onAddTask={() => setSelectedProject(project.id)}
          />
          {selectedProject === project.id && (
            <div className="mt-4">
              <h3 className="text-lg font-bold mb-2">Share Project</h3>
              <input
                type="text"
                value={shareUsers.join(', ')}
                onChange={(e) => setShareUsers(e.target.value.split(',').map(u => u.trim()))}
                placeholder="Enter usernames (comma-separated)"
                className="w-full p-2 mb-2 border rounded"
              />
              <button onClick={() => handleShareProject(project.id)} className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600">Share</button>

              <h3 className="text-lg font-bold mt-4 mb-2">Add Announcement</h3>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Announcement content"
                className="w-full p-2 mb-2 border rounded"
              />
              <input
                type="text"
                value={newAnnouncement.media}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, media: e.target.value })}
                placeholder="Media URL (optional)"
                className="w-full p-2 mb-2 border rounded"
              />
              <button onClick={() => handleAddAnnouncement(project.id)} className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">Add Announcement</button>

              <h3 className="text-lg font-bold mt-4 mb-2">Add Task</h3>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="text"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                placeholder="Assignee"
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
                required
              />
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button onClick={() => handleAddTask(project.id)} className="py-2 px-4 bg-purple-500 text-white rounded hover:bg-purple-600">Add Task</button>

              {project.announcements.map((ann) => (
                <Announcement
                  key={ann.id}
                  announcement={ann}
                  onLike={() => handleLikeAnnouncement(project.id, ann.id)}
                  onComment={(text) => handleAddAnnouncementComment(project.id, ann.id, text)}
                />
              ))}
              {project.tasks.map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onComment={(text) => handleAddTaskComment(project.id, task.id, text)}
                  onUpdateStatus={(status) => handleUpdateTaskStatus(project.id, task.id, status)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectsPage;