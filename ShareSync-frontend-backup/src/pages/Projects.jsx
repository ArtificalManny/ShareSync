import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Folder, PlusCircle, ThumbsUp, MessageSquare, Bell, Users } from 'lucide-react';
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
          family: 'Inter',
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
  const { user, isAuthenticated, socket, addProject } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState(user?.projects || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [suggestedWorkflow, setSuggestedWorkflow] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Projects - Fetching projects');
        setProjects(user?.projects || []);
        setLeaderboard([
          { name: 'Alice', points: 150 },
          { name: 'Bob', points: 120 },
          { name: 'Charlie', points: 100 },
        ]);
        setTeamActivity([
          { id: '1', user: 'Alice', action: 'Posted an announcement in Project Alpha', timestamp: new Date().toISOString() },
          { id: '2', user: 'Bob', action: 'Completed a task in Project Beta', timestamp: new Date().toISOString() },
        ]);
      } catch (err) {
        console.error('Projects - Error fetching projects:', err.message, err.stack);
        setError('Failed to load projects: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const suggestWorkflow = async () => {
      setSuggestedWorkflow({
        type: 'Kanban',
        reason: 'Recommended for small teams with iterative workflows.',
      });
    };

    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications((prev) => [...prev, notification].slice(-5));
      });

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

      socket.on('project-create', (newProject) => {
        if (newProject.admin === user?.email || newProject.members.some(m => m.email === user?.email)) {
          setProjects((prev) => [...prev, newProject]);
          addProject(newProject);
        }
      });
    }

    if (isAuthenticated) {
      fetchProjects();
      suggestWorkflow();
    } else {
      navigate('/login', { replace: true });
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('metric-update');
        socket.off('project-create');
      }
    };
  }, [isAuthenticated, navigate, socket, user, addProject]);

  const autoAssignTasks = async (projectId) => {
    console.log('Auto-assigning tasks for project:', projectId);
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === projectId
          ? { ...proj, tasksAssigned: true, assignedTo: ['Alice', 'Bob'] }
          : proj
      )
    );
  };

  const handlePostAnnouncement = (projectId) => {
    if (!newAnnouncement) return;
    const announcement = {
      id: `ann-${Date.now()}`,
      user: user.email,
      profilePicture: user.profilePicture,
      content: newAnnouncement,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === projectId
          ? { ...proj, announcements: [...(proj.announcements || []), announcement] }
          : proj
      )
    );
    setTeamActivity((prev) => [
      { id: `act-${Date.now()}`, user: user.email, action: `Posted an announcement in ${projects.find(p => p.id === projectId).title}`, timestamp: new Date().toISOString() },
      ...prev,
    ]);
    setNewAnnouncement('');
    setSelectedProjectId(null);
    socket.emit('notification', { message: `${user.email} posted an announcement in ${projects.find(p => p.id === projectId).title}`, userId: user.username });
  };

  const handleStatusChange = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === projectId ? { ...proj, status: newStatus } : proj
      )
    );
    socket.emit('metric-update', { projectId, status: newStatus });
  };

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
        backgroundColor: ['#26C6DA', '#FF6F61', '#8A9A5B'],
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
        data: projects.map((proj) => proj.tasksCompleted || 0),
        backgroundColor: '#26C6DA',
        borderColor: '#0A1A2F',
        borderWidth: 1,
      },
      {
        label: 'Total Tasks',
        data: projects.map((proj) => proj.totalTasks || 0),
        backgroundColor: '#8A9A5B',
        borderColor: '#0A1A2F',
        borderWidth: 1,
      },
    ],
  };

  const metrics = {
    totalProjects: projects.length,
    currentProjects: projects.filter(p => p.status === 'In Progress').length,
    pastProjects: projects.filter(p => p.status === 'Completed').length,
    tasksCompleted: projects.reduce((sum, proj) => sum + (proj.tasksCompleted || 0), 0),
  };

  return (
    <div className="projects-container">
      <div className="projects-header bg-glass py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-playfair text-accent-gold mb-4">Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary flex items-center mx-auto">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Project
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">You haven’t joined any projects yet.</p>
            <Link to="/"><p className="text-accent-teal hover:text-accent-coral transition-all">Go to Home to join a project!</p></Link>
          </div>
        ) : (
          <>
            <div className="metrics-section mb-8">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 text-center">Project Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 text-center">
                  <p className="text-gray-400">Total Projects</p>
                  <p className="text-2xl font-playfair text-accent-gold">{metrics.totalProjects}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-gray-400">Current Projects</p>
                  <p className="text-2xl font-playfair text-accent-gold">{metrics.currentProjects}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-gray-400">Past Projects</p>
                  <p className="text-2xl font-playfair text-accent-gold">{metrics.pastProjects}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-gray-400">Tasks Completed</p>
                  <p className="text-2xl font-playfair text-accent-gold">{metrics.tasksCompleted}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-playfair text-primary mb-4">Category Breakdown</h3>
                  <div className="chart-container">
                    <Pie data={categoryData} options={chartOptions} />
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="text-lg font-playfair text-primary mb-4">Task Completion</h3>
                  <div className="chart-container">
                    <Bar data={taskCompletionData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {suggestedWorkflow && (
              <div className="workflow-suggestion card p-6 mb-8">
                <h2 className="text-2xl font-playfair text-accent-teal mb-4">AI Workflow Suggestion</h2>
                <p className="text-primary">Suggested Workflow: <span className="text-accent-gold">{suggestedWorkflow.type}</span></p>
                <p className="text-gray-400">{suggestedWorkflow.reason}</p>
              </div>
            )}

            <div className="leaderboard-section card p-6 mb-8">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Team Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <ul className="space-y-2">
                  {leaderboard.map((member, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-accent-gold font-semibold">{index + 1}.</span>
                      <Users className="w-5 h-5 text-accent-teal" />
                      <span className="text-primary">{member.name}</span>
                      <span className="text-gray-400">{member.points} points</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No leaderboard data available.</p>
              )}
            </div>

            <div className="projects-grid">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Your Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="project-card card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/projects/${project.id}`}>
                        <h2 className="text-xl font-playfair text-accent-gold hover:underline">{project.title}</h2>
                      </Link>
                      <button
                        onClick={() => setSelectedProjectId(project.id)}
                        className="text-accent-teal hover:text-accent-coral transition-all"
                      >
                        Post Announcement
                      </button>
                    </div>
                    <p className="text-gray-400 mb-1">Category: {project.category}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-gray-400">Status:</p>
                      <select
                        value={project.status}
                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        className="input-field"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <p className="text-gray-400 mb-2">Privacy: {project.privacy}</p>
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
                    {project.tasksAssigned && (
                      <p className="text-gray-400 mt-2">
                        Assigned to: {project.assignedTo.join(', ')}
                      </p>
                    )}
                    <button
                      onClick={() => autoAssignTasks(project.id)}
                      className="btn-primary mt-2 rounded-full"
                    >
                      Auto-Assign Tasks
                    </button>
                    {project.announcements?.length > 0 && (
                      <div className="announcements mt-4">
                        <h3 className="text-lg font-playfair text-primary mb-2">Announcements</h3>
                        {project.announcements.map((ann) => (
                          <div key={ann.id} className="announcement-item card p-3 mb-2">
                            <div className="flex items-center mb-2">
                              <img
                                src={ann.profilePicture}
                                alt="User"
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                              <div>
                                <span className="text-primary font-semibold">{ann.user}</span>
                                <span className="text-gray-400 text-sm ml-2">{new Date(ann.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-primary">{ann.content}</p>
                            <div className="flex items-center mt-2 gap-4">
                              <button
                                className="flex items-center text-accent-teal hover:text-accent-coral transition-all"
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" /> {ann.likes || 0}
                              </button>
                              <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                                <MessageSquare className="w-4 h-4 mr-1" /> {ann.comments?.length || 0}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedProjectId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="card p-6 w-full max-w-md">
                  <h2 className="text-xl font-playfair text-accent-teal mb-4">Post Announcement</h2>
                  <textarea
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Write your announcement..."
                    className="input-field w-full h-24 mb-4"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => handlePostAnnouncement(selectedProjectId)}
                      className="btn-primary rounded-full flex-1"
                    >
                      Post
                    </button>
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="btn-primary bg-gray-700 rounded-full flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="notifications-section card p-6 mt-8">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" /> Notifications
              </h2>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div key={index} className="notification-item card p-2 mb-2">
                    <p className="text-gray-400 text-sm">{notif.message}</p>
                    <p className="text-gray-500 text-xs">{new Date().toLocaleTimeString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No notifications yet.</p>
              )}
            </div>

            <div className="team-activity-section card p-6 mt-8">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Team Activity</h2>
              {teamActivity.length > 0 ? (
                teamActivity.map((activity) => (
                  <div key={activity.id} className="activity-item card p-2 mb-2">
                    <p className="text-primary">{activity.user} {activity.action}</p>
                    <p className="text-gray-400 text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent updates.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;