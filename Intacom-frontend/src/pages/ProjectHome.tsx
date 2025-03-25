import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Upload from '../Upload';
import Settings from '../Settings';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: string;
}

interface ProjectHomeProps {
  projects: Project[] | undefined;
}

const ProjectHome: React.FC<ProjectHomeProps> = ({ projects }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings'>('home');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`/projects/by-id/${id}`);
        setProject(response.data.data.project);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProject();

    // Fetch tasks (mocked for now; in a real app, you'd have a backend endpoint)
    setTasks([
      { _id: '1', title: 'Design UI', description: 'Create wireframes for the homepage', status: 'To Do', projectId: id! },
      { _id: '2', title: 'Implement API', description: 'Set up API endpoints for tasks', status: 'In Progress', projectId: id! },
    ]);
  }, [id]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDescription) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    const newTask: Task = {
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'To Do',
      projectId: id!,
    };
    setTasks([...tasks, { ...newTask, _id: `${tasks.length + 1}` }]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSuccessMessage('Task added successfully');
    setErrorMessage('');
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    setTasks(tasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)));
  };

  if (!project) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>{project.name}</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1.5rem' }}>
        {project.description || 'No description'}
      </p>
      <div className="project-tabs">
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('upload')}>Upload</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
      </div>
      {activeTab === 'home' && (
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks</h3>
          <form onSubmit={handleAddTask} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="taskTitle">Task Title</label>
              <input
                id="taskTitle"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="taskDescription">Description</label>
              <textarea
                id="taskDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Enter task description"
                required
                rows={3}
              />
            </div>
            <button type="submit">Add Task</button>
          </form>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          {successMessage && (
            <div style={{ color: '#4caf50', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {successMessage}
            </div>
          )}
          {tasks.length === 0 ? (
            <p style={{ fontSize: '1rem', opacity: 0.8 }}>No tasks yet. Add a task to get started!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="project-card"
                  style={{
                    borderLeft: `4px solid ${
                      task.status === 'To Do' ? '#ff5555' : task.status === 'In Progress' ? '#ffa500' : '#4caf50'
                    }`,
                  }}
                >
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task._id!, e.target.value as 'To Do' | 'In Progress' | 'Done')}
                    style={{ marginTop: '0.5rem' }}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'upload' && <Upload />}
      {activeTab === 'settings' && <Settings />}
    </div>
  );
};

export default ProjectHome;