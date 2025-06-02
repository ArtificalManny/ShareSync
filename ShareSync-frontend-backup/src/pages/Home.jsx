import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Menu, X } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log('Home.jsx - Component rendering started, isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'authError:', authError);

  useEffect(() => {
    console.log('Home.jsx - useEffect triggered');
    if (isLoading) {
      console.log('Home - Waiting for AuthContext to finish loading');
      return;
    }

    console.log('Home - isLoading is false, checking authentication');
    if (!isAuthenticated) {
      console.log('Home - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    console.log('Home - Checking user data');
    if (!user || !user.email) {
      console.log('Home - User data not available, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    console.log('Home - User authenticated, compiling feed items for user:', user.email);
    try {
      const activeProjects = (user.projects || []).filter(project => {
        if (!project || !project.status) {
          console.warn('Home - Invalid project data:', project);
          return false;
        }
        return project.status !== 'Completed';
      });
      console.log('Home - Active projects:', activeProjects);

      const allFeedItems = activeProjects.flatMap(project => {
        const activityLogs = (project.activityLog || []).map(log => ({
          projectId: project.id,
          projectTitle: project.title,
          type: 'activity',
          message: log.message || 'Unknown activity',
          user: log.user || 'Unknown user',
          timestamp: log.timestamp || new Date().toISOString(),
        }));

        const posts = (project.posts || []).map(post => ({
          projectId: project.id,
          projectTitle: project.title,
          type: post.type || 'announcement',
          content: post.content || 'No content',
          author: post.author || 'Unknown author',
          timestamp: post.timestamp || new Date().toISOString(),
          votes: post.votes || [],
          options: post.options || [],
        }));

        const tasks = (project.tasks || []).filter(task => task.status === 'Completed').map(task => ({
          projectId: project.id,
          projectTitle: project.title,
          type: 'task-complete',
          message: `${task.title || 'Unnamed task'} completed`,
          user: task.assignedTo || 'Unassigned',
          timestamp: task.updatedAt || new Date().toISOString(),
        }));

        const files = (project.files || []).map(file => ({
          projectId: project.id,
          projectTitle: project.title,
          type: 'file',
          message: `Shared file: ${file.name || 'Unnamed file'}`,
          user: file.uploadedBy || 'Unknown user',
          timestamp: file.uploadedAt || new Date().toISOString(),
          url: file.url || '#',
        }));

        return [...activityLogs, ...posts, ...tasks, ...files].map(item => ({
          ...item,
          likes: 0,
          comments: [],
          shares: 0,
        }));
      });

      allFeedItems.sort((a, b) => new Date(b.timestamp || new Date()) - new Date(a.timestamp || new Date()));
      setFeedItems(allFeedItems);
      console.log('Home - Feed items set:', allFeedItems);
    } catch (err) {
      console.error('Home - Error compiling feed items:', err.message);
      setFeedItems([]);
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  const handleLike = (index) => {
    console.log('Home - Liking feed item at index:', index);
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, likes: item.likes + 1 } : item
      )
    );
  };

  const handleCommentSubmit = (index, e) => {
    e.preventDefault();
    const commentText = newComment[index] || '';
    if (!commentText.trim()) return;

    console.log('Home - Submitting comment for feed item at index:', index, 'comment:', commentText);
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, comments: [...item.comments, { text: commentText, user: user.email || 'Anonymous', timestamp: new Date().toISOString() }] }
          : item
      )
    );
    setNewComment(prev => ({ ...prev, [index]: '' }));
    setExpandedComments(prev => ({ ...prev, [index]: true }));
  };

  const handleShare = (index) => {
    console.log('Home - Sharing feed item at index:', index);
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, shares: item.shares + 1 } : item
      )
    );
    alert('Shared! (This is a mock action—implement sharing logic as needed.)');
  };

  const toggleComments = (index) => {
    console.log('Home - Toggling comments for feed item at index:', index);
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSidebar = () => {
    console.log('Home - Toggling sidebar, current state:', isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    console.log('Home - Rendering loading state');
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-coral-pink text-xl font-poppins ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    console.log('Home - Rendering auth error state:', authError);
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-poppins">{authError}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Home - Not authenticated, should have redirected');
    return null;
  }

  if (!user) {
    console.log('Home - No user data, rendering fallback');
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-deep-teal text-lg font-poppins">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  console.log('Home - Rendering main content for user:', user.firstName);
  return (
    <div className="home-container flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar (Hidden on mobile by default, toggled with hamburger) */}
      <div className={`sidebar fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-deep-teal p-4 flex flex-col gap-4 lg:flex`}>
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-xl font-poppins font-semibold text-coral-pink">Activity Summary</h2>
          <button
            className="lg:hidden text-golden-yellow focus:outline-none focus:ring-2 focus:ring-golden-yellow"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {(user.projects || []).filter(p => p.status !== 'Completed').slice(0, 5).map(project => (
              <div key={project.id} className="sidebar-item p-3 bg-coral-pink bg-opacity-20 rounded-lg">
                <Link to={`/projects/${project.id}`} className="text-golden-yellow font-poppins font-medium hover:underline">{project.title}</Link>
                <p className="text-light-text text-sm font-poppins">Status: {project.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-4 lg:p-8">
        {/* Hamburger Menu for Mobile */}
        <button
          className="lg:hidden mb-4 text-golden-yellow focus:outline-none focus:ring-2 focus:ring-golden-yellow"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="home-header mb-8">
          <h1 className="text-4xl font-poppins font-bold text-coral-pink mb-2 animate-text-glow">
            Welcome to ShareSync, {user.firstName}!
          </h1>
          <p className="text-deep-teal text-lg font-poppins">
            Stay connected with all your active projects.
          </p>
        </div>

        <div className="feed-container">
          <h2 className="text-2xl font-poppins font-semibold text-coral-pink mb-6 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-golden-yellow animate-pulse" aria-hidden="true" /> Project Activity Feed
          </h2>
          {feedItems.length === 0 ? (
            <p className="text-deep-teal flex items-center gap-2 font-poppins">
              <AlertCircle className="w-5 h-5 text-golden-yellow animate-pulse" aria-hidden="true" /> No recent activity in your active projects.
            </p>
          ) : (
            <div className="space-y-6">
              {feedItems.map((item, index) => (
                <div key={index} className="feed-item card p-6 glassmorphic animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <Link to={`/projects/${item.projectId}`} className="text-coral-pink font-poppins font-bold text-lg hover:underline">
                      {item.projectTitle}
                    </Link>
                    <p className="text-deep-teal text-sm font-poppins">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                  {item.type === 'activity' ? (
                    <p className="text-light-text font-poppins">{item.message} by {item.user}</p>
                  ) : item.type === 'task-complete' ? (
                    <p className="text-light-text font-poppins flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-golden-yellow" aria-hidden="true" /> {item.message} by {item.user}
                    </p>
                  ) : item.type === 'file' ? (
                    <p className="text-light-text font-poppins flex items-center gap-2">
                      <FileText className="w-5 h-5 text-golden-yellow" aria-hidden="true" /> {item.message} by {item.user}
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-coral-pink hover:underline ml-2">View File</a>
                    </p>
                  ) : (
                    <>
                      <p className="text-light-text font-poppins">{item.content}</p>
                      {item.type === 'picture' && (
                        <img src={item.content} alt="Post content" className="w-full h-48 object-cover rounded-lg mt-3" />
                      )}
                      {item.type === 'poll' && (
                        <div className="mt-3 space-y-2">
                          {item.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <button className="btn-primary rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-golden-yellow" aria-label={`Vote for ${option}`}>Vote</button>
                              <span className="text-light-text font-poppins">{option}</span>
                              <span className="text-deep-teal font-poppins">({item.votes.filter(v => v.option === option).length} votes)</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-deep-teal text-sm mt-2 font-poppins">Posted by {item.author}</p>
                    </>
                  )}
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => handleLike(index)}
                      className="flex items-center gap-1 text-coral-pink hover:text-golden-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-golden-yellow animate-pulse-on-hover"
                      aria-label={`Like this update (${item.likes} likes)`}
                    >
                      <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {item.likes} Likes
                    </button>
                    <button
                      onClick={() => toggleComments(index)}
                      className="flex items-center gap-1 text-coral-pink hover:text-golden-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                      aria-label="Toggle comments"
                    >
                      <MessageSquare className="w-5 h-5" aria-hidden="true" /> {item.comments.length} Comments
                    </button>
                    <button
                      onClick={() => handleShare(index)}
                      className="flex items-center gap-1 text-coral-pink hover:text-golden-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                      aria-label={`Share this update (${item.shares} shares)`}
                    >
                      <Share2 className="w-5 h-5" aria-hidden="true" /> {item.shares} Shares
                    </button>
                  </div>
                  {expandedComments[index] && (
                    <div className="comments-section mt-4 animate-slide-down">
                      {item.comments.length > 0 ? (
                        <div className="space-y-2">
                          {item.comments.map((comment, cIndex) => (
                            <div key={cIndex} className="comment p-3 bg-deep-teal bg-opacity-20 rounded-lg">
                              <p className="text-light-text text-sm font-poppins">
                                <strong>{comment.user}:</strong> {comment.text}
                              </p>
                              <p className="text-deep-teal text-xs font-poppins">{new Date(comment.timestamp).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-deep-teal text-sm font-poppins">No comments yet.</p>
                      )}
                      <form onSubmit={(e) => handleCommentSubmit(index, e)} className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          value={newComment[index] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [index]: e.target.value }))}
                          placeholder="Add a comment..."
                          className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                          aria-label="Add a comment"
                        />
                        <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-golden-yellow" aria-label="Submit comment">
                          <Send className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;