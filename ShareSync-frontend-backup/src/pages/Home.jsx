import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThumbsUp, MessageSquare, Share2, Bell, Folder, PlusCircle, Users, AlertCircle, List, Info } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated, globalMetrics, socket, joinProject, updateProject } = useContext(AuthContext);
  const [projectFeed, setProjectFeed] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const availableProjects = [
    { id: '1', title: 'Project Alpha', description: 'A tech innovation project', members: [{ email: 'john@example.com', profilePicture: 'https://via.placeholder.com/150' }, { email: 'jane@example.com', profilePicture: 'https://via.placeholder.com/150' }], posts: [] },
    { id: '2', title: 'Project Beta', description: 'Marketing campaign', members: [{ email: 'alice@example.com', profilePicture: 'https://via.placeholder.com/150' }], posts: [] },
    { id: '3', title: 'Project Gamma', description: 'Design overhaul', members: [{ email: 'bob@example.com', profilePicture: 'https://via.placeholder.com/150' }, { email: 'charlie@example.com', profilePicture: 'https://via.placeholder.com/150' }, { email: 'dave@example.com', profilePicture: 'https://via.placeholder.com/150' }], posts: [] },
  ];

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        if (notification.userId !== user?.username) {
          setNotifications((prev) => [notification, ...prev].slice(0, 10));
          const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
          audio.play().catch((err) => console.warn('Audio playback failed:', err));
        }
      });

      socket.on('post', (post) => {
        if (!selectedProject || post.projectId === selectedProject.id) {
          setProjectFeed((prev) => [
            { id: `post-${prev.length + 1}`, project: post.project || 'Unknown', type: 'post', ...post },
            ...prev,
          ]);
        }
        updateProject(post.projectId, {
          posts: [...(user.projects.find(p => p.id === post.projectId)?.posts || []), post],
        });
      });

      socket.on('project-create', (newProject) => {
        if (newProject.admin === user?.email || newProject.members.some(m => m.email === user?.email)) {
          user.projects = [...(user.projects || []), newProject];
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('post');
        socket.off('project-create');
      }
    };
  }, [socket, user, selectedProject, updateProject]);

  const handleJoinProject = (project) => {
    joinProject(project);
    setSelectedProject(project);
    setProjectFeed(project.posts || []);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setProjectFeed(project.posts || []);
  };

  const handlePost = () => {
    if (!newPost || !socket || !selectedProject) return;
    const post = {
      id: `post-${projectFeed.length + 1}`,
      project: selectedProject.title,
      projectId: selectedProject.id,
      type: 'post',
      user: user?.email || 'Guest',
      profilePicture: user?.profilePicture,
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    socket.emit('post', post);
    setProjectFeed((prev) => [post, ...prev]);
    setNewPost('');
    socket.emit('notification', { message: `New post in ${selectedProject.title} by ${user?.email || 'Guest'}`, userId: user?.username });
  };

  const handleLike = (itemId) => {
    if (!socket || !selectedProject) return;
    setProjectFeed((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );
    const updatedPosts = projectFeed.map((item) =>
      item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
    );
    updateProject(selectedProject.id, { posts: updatedPosts });
    socket.emit('notification', { message: `${user?.email || 'Guest'} liked a post in ${selectedProject?.title || 'a project'}`, userId: user?.username });
  };

  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-3xl font-inter text-holo-blue mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 mr-2 text-holo-pink" /> Welcome to ShareSync!
          </h2>
          <p className="text-holo-gray mb-6">Please log in to start collaborating on projects.</p>
          <Link to="/login">
            <button className="btn-primary">Log In</button>
          </Link>
        </div>
      </div>
    );
  }

  const userProjects = user?.projects || [];
  const notificationsCount = notifications.length;

  return (
    <div className="home-container">
      <div className="hero-section bg-holo-bg-dark py-12 px-6 text-center rounded-b-3xl">
        <h1 className="text-4xl font-inter text-holo-blue mb-4">Welcome, {user?.firstName || 'User'}!</h1>
        <p className="text-holo-gray text-lg mb-6">Collaborate, track, and succeed with ShareSync.</p>
        <Link to="/projects/create">
          <button className="btn-primary flex items-center mx-auto">
            <PlusCircle className="w-5 h-5 mr-2" /> Create a New Project
          </button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content: Projects and Feed */}
          <div className="md:col-span-2 space-y-6">
            {/* Projects Section */}
            <div className="projects-section card p-6">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2 text-holo-pink" /> Your Projects
              </h2>
              {userProjects.length === 0 ? (
                <div className="text-center">
                  <p className="text-holo-gray mb-4 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-holo-pink" /> You haven’t joined any projects yet.
                  </p>
                  <Link to="/projects">
                    <p className="text-holo-blue hover:text-holo-pink transition-all">Explore projects to join!</p>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProjects.map((proj) => (
                    <Link to={`/projects/${proj.id}`} key={proj.id} className="project-card card p-4 flex items-center gap-4 hover:bg-holo-bg-dark transition-all">
                      <Folder className="w-8 h-8 text-holo-pink" />
                      <div className="flex-1">
                        <h3 className="text-lg font-inter text-holo-blue">{proj.title}</h3>
                        <p className="text-holo-gray text-sm flex items-center gap-2">
                          <List className="w-4 h-4 text-holo-pink" /> {proj.description || 'No description'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Project Feed Section */}
            <div className="feed-section card p-6">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-holo-pink" /> Project Feed
              </h2>
              {userProjects.length === 0 ? (
                <p className="text-holo-gray text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5 text-holo-pink" /> Join a project to see updates!
                </p>
              ) : !selectedProject ? (
                <div className="text-center">
                  <p className="text-holo-gray mb-4 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-holo-pink" /> Select a project to view its feed.
                  </p>
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const proj = userProjects.find((p) => p.id === e.target.value);
                      handleProjectSelect(proj || null);
                    }}
                    className="input-field w-full max-w-xs mx-auto"
                  >
                    <option value="">Select a project</option>
                    {userProjects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="post-input card p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <img
                        src={user?.profilePicture || 'https://via.placeholder.com/150'}
                        alt="User"
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder={`Share an update in ${selectedProject.title}...`}
                        className="input-field w-full h-16"
                      />
                    </div>
                    <button onClick={handlePost} className="btn-primary rounded-full">Post</button>
                  </div>
                  {projectFeed.length === 0 ? (
                    <p className="text-holo-gray text-center flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-holo-pink" /> No updates yet. Be the first to post!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {projectFeed.map((item) => (
                        <div key={item.id} className="feed-item card p-4 holographic-effect">
                          <div className="flex items-center mb-2">
                            <img
                              src={item.profilePicture || 'https://via.placeholder.com/150'}
                              alt="User"
                              className="w-8 h-8 rounded-full mr-2 object-cover"
                            />
                            <div>
                              <span className="text-primary font-semibold">{item.user}</span>
                              <span className="text-holo-gray text-sm ml-2">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-primary">{item.content}</p>
                          <div className="flex items-center mt-3 gap-4">
                            <button
                              onClick={() => handleLike(item.id)}
                              className="flex items-center text-holo-blue hover:text-holo-pink transition-all"
                            >
                              <ThumbsUp className="w-5 h-5 mr-1" /> {item.likes || 0}
                            </button>
                            <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
                              <MessageSquare className="w-5 h-5 mr-1" /> Comment
                            </button>
                            <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
                              <Share2 className="w-5 h-5 mr-1" /> Share
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar: Notifications and Available Projects */}
          <div className="md:col-span-1">
            <div className="sidebar card p-6 sticky top-20 space-y-6">
              <div className="notifications-section">
                <h2 className="text-xl font-inter text-holo-blue mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 cursor-pointer text-holo-pink" onClick={() => setShowNotifications(!showNotifications)} />
                  Notifications ({notificationsCount})
                </h2>
                {showNotifications && (
                  <div className="notifications-list space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((notif, index) => (
                        <div key={index} className="notification-item card p-2">
                          <p className="text-holo-gray text-sm">{notif.message}</p>
                          <p className="text-holo-gray-dark text-xs">{new Date().toLocaleTimeString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-holo-gray flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-holo-pink" /> No notifications yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="available-projects-section">
                <h2 className="text-xl font-inter text-holo-blue mb-4 flex items-center">
                  <Folder className="w-5 h-5 mr-2 text-holo-pink" /> Join a Project
                </h2>
                <p className="text-holo-gray text-sm mb-4">Discover and join public projects to collaborate with others.</p>
                <ul className="space-y-3">
                  {availableProjects.map((proj) => (
                    <li key={proj.id} className="relative">
                      <div
                        className="project-card card p-4 flex items-center gap-3 hover:bg-holo-bg-dark transition-all cursor-pointer"
                        onClick={() => handleJoinProject(proj)}
                        onMouseEnter={() => setTooltip(proj.id)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <Folder className="w-6 h-6 text-holo-pink" />
                        <div className="flex-1">
                          <p className="font-semibold text-holo-blue">{proj.title}</p>
                          <p className="text-holo-gray text-sm flex items-center gap-2">
                            <List className="w-4 h-4 text-holo-pink" /> {proj.description}
                          </p>
                          <p className="text-holo-gray text-sm flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4 text-holo-pink" /> {proj.members.length} Members
                          </p>
                        </div>
                        <button className="btn-primary rounded-full text-sm px-3 py-1">Join</button>
                      </div>
                      {tooltip === proj.id && (
                        <div className="absolute top-0 left-0 mt-12 w-full bg-holo-bg-dark text-holo-gray text-sm p-2 rounded-lg shadow-lg z-10">
                          Click to join {proj.title} and start collaborating with {proj.members.length} members!
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;