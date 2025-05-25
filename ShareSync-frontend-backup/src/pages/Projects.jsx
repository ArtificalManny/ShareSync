import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './Projects.css';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#F5F6FA',
        font: {
          family: 'Inter, sans-serif',
          size: 14,
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#F5F6FA' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
    },
    x: {
      ticks: { color: '#F5F6FA' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
    },
  },
};

const Projects = () => {
  const { user, isAuthenticated, socket } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([
    { id: '1', title: 'Project Alpha', category: 'Job', status: 'In Progress', tasksCompleted: 5, totalTasks: 10 },
    { id: '2', title: 'Project Beta', category: 'Personal', status: 'Completed', tasksCompleted: 8, totalTasks: 8 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Projects - Fetching projects');
        setProjects(projects);
      } catch (err) {
        console.error('Projects - Error fetching projects:', err.message, err.stack);
        setError('Failed to load projects: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (socket) {
      socket.on('metric-update', (update) => {
        setProjects((prev) =>
          prev.map((proj) =>
            proj.id === update.projectId
              ? {
                  ...proj,
                  tasksCompleted: update.tasksCompleted || proj.tasksCompleted,
                  totalTasks: update.totalTasks || proj.totalTasks,
                }
              : proj
          )
        );
      });
    } else {
      console.warn('Socket is not initialized');
    }

    if (isAuthenticated) {
      fetchProjects();
    } else {
      console.log('Projects - Not authenticated, navigating to login');
      navigate('/login', { replace: true });
    }

    return () => {
      if (socket) socket.off('metric-update');
    };
  }, [isAuthenticated, navigate, socket]);

  if (loading) return <div className="projects-container"><p className="text-gray-400">Loading...</p></div>;

  if (error) {
    return (
      <div className="projects-container">
        <p className="text-red-500">{error}</p>
        {error.includes('token') && (
          <p className="text-gray-400">
            Please <Link to="/login" className="text-accent-teal hover:underline">log in</Link> to view projects.
          </p>
        )}
      </div>
    );
  }

  const categoryBreakdown = projects.reduce((acc, proj) => {
    acc[proj.category] = (acc[proj.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = {
    labels: Object.keys(categoryBreakdown),
    datasets: [
      {
        label: 'Projects by Category',
        data: Object.values(categoryBreakdown),
        backgroundColor: ['#26C6DA', '#FFD700', '#A0A0A0'],
        borderColor: ['#0A1A2F', '#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  const taskCompletionData = {
    labels: projects.map((proj) => proj.title),
    datasets: [
      {
        label: 'Tasks Completed',
        data: projects.map((proj) => proj.tasksCompleted),
        backgroundColor: '#26C6DA',
        borderColor: '#0A1A2F',
        borderWidth: 1,
      },
      {
        label: 'Total Tasks',
        data: projects.map((proj) => proj.totalTasks),
        backgroundColor: '#A0A0A0',
        borderColor: '#0A1A2F',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1 className="text-3xl font-inter text-primary">Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary">Create New Project</button>
        </Link>
      </div>
      <div className="metrics-section mb-8">
        <h2 className="text-xl font-inter text-accent-teal mb-4">Project Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-glass p-6 rounded-lg shadow-soft">
            <h3 className="text-primary mb-4">Category Breakdown</h3>
            <div className="chart-container">
              <Pie data={categoryData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-glass p-6 rounded-lg shadow-soft">
            <h3 className="text-primary mb-4">Task Completion</h3>
            <div className="chart-container">
              <Bar data={taskCompletionData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
      <div className="projects-grid">
        {projects.length === 0 ? (
          <p className="text-gray-400">No projects found. Start by creating one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link to={`/projects/${project.id}`} key={project.id}>
                <div className="project-card bg-glass p-6 rounded-lg shadow-soft hover:shadow-lg transition-all">
                  <h2 className="text-xl font-inter text-primary">{project.title}</h2>
                  <p className="text-gray-400">Category: {project.category}</p>
                  <p className="text-accent-gold">Status: {project.status}</p>
                  <div className="progress-bar mt-4">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(project.tasksCompleted / project.totalTasks) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-gray-400 mt-2">
                    {project.tasksCompleted}/{project.totalTasks} tasks completed
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;