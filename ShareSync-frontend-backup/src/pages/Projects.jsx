import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, PlusCircle, ThumbsUp, MessageSquare, Bell, Users, AlertCircle, List } from 'lucide-react';
import './Projects.css';

const Projects = () => {
  const { user, isAuthenticated, socket, addProject, updateProject, isLoading: authLoading, setIntendedRoute } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Memoize functions to prevent unnecessary re-renders
  const handleAddProject = useCallback((newProject) => {
    addProject(newProject);
  }, [addProject]);

  const handleUpdateProject = useCallback((projectId, updates) => {
    updateProject(projectId, updates);
  }, [updateProject]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (authLoading) {
          console.log('Projects - Waiting for AuthContext to finish loading');
          return;
        }

        if (!isAuthenticated) {
          console.log('Projects - User not authenticated, redirecting to login');
          setIntendedRoute('/projects');
          navigate('/login', { replace: true });
          return;
        }

        if (!user || !user.email) {
          console.log('Projects - User data not available');
          setError('User data not available. Please log in again.');
          setIntendedRoute('/projects');
          navigate('/login', { replace: true });
          return;
        }

        console.log('Projects - Fetching projects for user:', user.email);
        const userProjects = Array.isArray(user.projects) ? user.projects : [];
        setProjects(userProjects);
        if (userProjects.length === 0) {
          console.log('Projects - No projects found for user');
        }
      } catch (err) {
        console.error('Projects - Error fetching projects:', err.message, err.stack);
        setError('Failed to load projects: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Timeout to detect if loading takes too long
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Loading projects timed out. Please try again.');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, authLoading, navigate, setIntendedRoute]);

  // Separate useEffect for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      if (notification.userId !== user?.username) {
        setNotifications((prev) => [...prev, notification].slice(-5));
      }
    };

    const handleMetricUpdate = (update) => {
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
      handleUpdateProject(update.projectId, {
        tasksCompleted: update.tasksCompleted,
        totalTasks: update.totalTasks,
      });
    };

    const handleProjectCreate = (newProject) => {
      if (newProject.admin === user?.email || newProject.members.some(m => m.email === user?.email)) {
        setProjects((prev) => [...prev, newProject]);
        handleAddProject(newProject);
      }
    };

    socket.on('notification', handleNotification);
    socket.on('metric-update', handleMetricUpdate);
    socket.on('project-create', handleProjectCreate);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('metric-update', handleMetricUpdate);
      socket.off('project-create', handleProjectCreate);
    };
  }, [socket, user, handleAddProject, handleUpdateProject]);

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
    handleUpdateProject(projectId, {
      announcements: [...(projects.find(p => p.id === projectId)?.announcements || []), announcement],
    });
    setNewAnnouncement('');
    setSelectedProjectId(null);
    socket.emit('notification', {
      message: `${user.email} posted an announcement in ${projects.find(p => p.id === projectId)?.title}`,
      userId: user.username,
    });
  };

  const handleStatusChange = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === projectId ? { ...proj, status: newStatus } : proj
      )
    );
    handleUpdateProject(projectId, { status: newStatus });
    socket.emit('metric-update', { projectId, status: newStatus });
  };

  if (loading) return <div className="projects-container"><p className="text-holo-gray">Loading projects...</p></div>;

  if (error) {
    return (
      <div className="projects-container">
        <p className="text-red-500">{error}</p>
        {(error.includes('token') || error.includes('User data not available')) && (
          <p className="text-holo-gray">
            Please <Link to="/login" className="text-holo-blue hover:underline">log in</Link> to view projects.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header bg-holo-bg-dark py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 flex items-center justify-center">
          <Folder className="w-6 h-6 mr-2 text-holo-pink animate-pulse" /> Your Projects
        </h1>
        <Link to="/projects/create">
          <button className="btn-primary flex items-center mx-auto animate-glow">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Project
          </button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center">
            <p className="text-holo-gray mb-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> You haven’t joined any projects yet.
            </p>
            <Link to="/">
              <p className="text-holo-blue hover:text-holo-pink transition-all animate-glow">Go to Home to join a project!</p>
            </Link>
          </div>
        ) : (
          <>
            <div className="projects-grid mb-8">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Your Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Link
                    to={`/projects/${project.id}`}
                    key={project.id}
                    className="project-card card p-6 hover:bg-holo-bg-dark transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-inter text-holo-blue animate-text-glow">{project.title}</h2>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedProjectId(project.id);
                        }}
                        className="text-holo-blue hover:text-holo-pink transition-all text-sm"
                      >
                        Post Announcement
                      </button>
                    </div>
                    <p className="text-holo-gray mb-2 flex items-center gap-2">
                      <List className="w-4 h-4 text-holo-pink" /> {project.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex">
                        {project.members.slice(0, 3).map((member, index) => (
                          <img
                            key={index}
                            src={member.profilePicture}
                            alt={member.email}
                            className="w-8 h-8 rounded-full object-cover border-2 border-holo-blue"
                            style={{ marginLeft: index > 0 ? '-12px' : '0' }}
                          />
                        ))}
                        {project.members.length > 3 && (
                          <span
                            className="w-8 h-8 rounded-full bg-holo-bg-light text-primary flex items-center justify-center text-xs border-2 border-holo-blue"
                            style={{ marginLeft: '-12px' }}
                          >
                            +{project.members.length - 3}
                          </span>
                        )}
                      </div>
                      <p className="text-holo-gray text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-holo-pink" />
                        {project.members.slice(0, 2).map(m => m.email.split('@')[0]).join(', ')}
                        {project.members.length > 2 ? `, and ${project.members.length - 2} more` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-holo-gray">Status:</p>
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
                        <h3 className="text-lg font-inter text-primary mb-2 flex items-center">
                          <Bell className="w-4 h-4 text-holo-pink mr-2 animate-pulse" /> Recent Announcements
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
                                <span className="text-holo-gray text-sm ml-2">{new Date(ann.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-primary">{ann.content}</p>
                            <div className="flex items-center mt-2 gap-4">
                              <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
                                <ThumbsUp className="w-4 h-4 mr-1" /> {ann.likes || 0}
                              </button>
                              <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
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
                  <h2 className="text-xl font-inter text-holo-blue mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Post Announcement
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
                      className="btn-primary rounded-full flex-1 animate-glow"
                    >
                      Post
                    </button>
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="btn-primary bg-holo-bg-light rounded-full flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="notifications-section card p-6">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Notifications
              </h2>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div key={index} className="notification-item card p-2 mb-2">
                    <p className="text-holo-gray text-sm">{notif.message}</p>
                    <p className="text-holo-gray-dark text-xs">{new Date().toLocaleTimeString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-holo-gray flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-holo-pink animate-pulse" /> No notifications yet.
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