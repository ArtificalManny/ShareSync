import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, PlusCircle, ThumbsUp, MessageSquare, Bell, Users, AlertCircle, List } from 'lucide-react';
import './Projects.css';

const Projects = () => {
  const { user, isAuthenticated, socket, addProject, updateProject } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState(user?.projects || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Projects - Fetching projects');
        setProjects(user?.projects || []);
      } catch (err) {
        console.error('Projects - Error fetching projects:', err.message, err.stack);
        setError('Failed to load projects: ' + err.message);
      } finally {
        setLoading(false);
      }
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
        updateProject(update.projectId, {
          tasksCompleted: update.tasksCompleted,
          totalTasks: update.totalTasks,
        });
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
  }, [isAuthenticated, navigate, socket, user, addProject, updateProject]);

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
    updateProject(projectId, {
      announcements: [...(projects.find(p => p.id === projectId).announcements || []), announcement],
    });
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
    updateProject(projectId, { status: newStatus });
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

  return (
    <div className="projects-container">
      <div className="projects-header bg-glass py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-playfair text-accent-gold mb-4 flex items-center justify-center">
          <Folder className="w-6 h-6 mr-2" /> Your Projects
        </h1>
        <Link to="/projects/create">
          <button className="btn-primary flex items-center mx-auto">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Project
          </button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent-teal" /> You haven’t joined any projects yet.
            </p>
            <Link to="/"><p className="text-accent-teal hover:text-accent-coral transition-all">Go to Home to join a project!</p></Link>
          </div>
        ) : (
          <>
            <div className="projects-grid mb-8">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2" /> Your Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Link to={`/projects/${project.id}`} key={project.id} className="project-card card p-6 hover:bg-teal-900 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-playfair text-accent-gold">{project.title}</h2>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedProjectId(project.id);
                        }}
                        className="text-accent-teal hover:text-accent-coral transition-all text-sm"
                      >
                        Post Announcement
                      </button>
                    </div>
                    <p className="text-gray-400 mb-2 flex items-center gap-2">
                      <List className="w-4 h-4 text-accent-teal" /> {project.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex">
                        {project.members.slice(0, 3).map((member, index) => (
                          <img
                            key={index}
                            src={member.profilePicture}
                            alt={member.email}
                            className="w-8 h-8 rounded-full object-cover border-2 border-accent-gold"
                            style={{ marginLeft: index > 0 ? '-12px' : '0' }}
                          />
                        ))}
                        {project.members.length > 3 && (
                          <span className="w-8 h-8 rounded-full bg-accent-sage text-primary flex items-center justify-center text-xs border-2 border-accent-gold" style={{ marginLeft: '-12px' }}>
                            +{project.members.length - 3}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-teal" />
                        {project.members.slice(0, 2).map(m => m.email.split('@')[0]).join(', ')}
                        {project.members.length > 2 ? `, and ${project.members.length - 2} more` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-gray-400">Status:</p>
                      <select
                        value={project.status}
                        onChange={(e) => {
                          e.preventDefault();
                          handleStatusChange(project.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="input-field text-sm"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    {project.announcements?.length > 0 && (
                      <div className="announcements mt-4">
                        <h3 className="text-lg font-playfair text-primary mb-2 flex items-center">
                          <Bell className="w-4 h-4 text-accent-teal mr-2" /> Recent Announcements
                        </h3>
                        {project.announcements.slice(-1).map((ann) => (
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
                  </Link>
                ))}
              </div>
            </div>

            {selectedProjectId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="card p-6 w-full max-w-md">
                  <h2 className="text-xl font-playfair text-accent-teal mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" /> Post Announcement
                  </h2>
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

            <div className="notifications-section card p-6">
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
                <p className="text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-teal" /> No notifications yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;