import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

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
    // Compile feed items from all active projects with error handling
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

      // Sort feed items by timestamp (most recent first)
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

  if (isLoading) {
    console.log('Home - Rendering loading state');
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-holo-blue text-xl font-inter ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    console.log('Home - Rendering auth error state:', authError);
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-inter">{authError}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Home - Not authenticated, should have redirected');
    return null; // Should have redirected to /login
  }

  if (!user) {
    console.log('Home - No user data, rendering fallback');
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-holo-gray text-lg font-inter">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  console.log('Home - Rendering main content for user:', user.firstName);
  return (
    <div className="home-container">
      <div className="home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
          Welcome to ShareSync, {user.firstName}!
        </h1>
        <p className="text-holo-gray text-lg font-inter mb-4">
          Stay connected with all your active projects.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-inter text-holo-blue mb-6 flex items-center">
          <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Project Activity Feed
        </h2>
        {feedItems.length === 0 ? (
          <p className="text-holo-gray flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No recent activity in your active projects.
          </p>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item, index) => (
              <div key={index} className="feed-item card p-4 glassmorphic animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <Link to={`/projects/${item.projectId}`} className="text-holo-blue font-inter font-bold text-lg hover:underline">
                    {item.projectTitle}
                  </Link>
                  <p className="text-holo-gray text-sm">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                {item.type === 'activity' ? (
                  <p className="text-holo-gray">{item.message} by {item.user}</p>
                ) : item.type === 'task-complete' ? (
                  <p className="text-holo-gray flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-holo-pink" aria-hidden="true" /> {item.message} by {item.user}
                  </p>
                ) : item.type === 'file' ? (
                  <p className="text-holo-gray flex items-center gap-2">
                    <FileText className="w-5 h-5 text-holo-pink" aria-hidden="true" /> {item.message} by {item.user}
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-holo-blue hover:underline ml-2">View File</a>
                  </p>
                ) : (
                  <>
                    <p className="text-holo-gray">{item.content}</p>
                    {item.type === 'picture' && (
                      <img src={item.content} alt="Post content" className="w-full h-48 object-cover rounded-lg mt-2" />
                    )}
                    {item.type === 'poll' && (
                      <div className="mt-2 space-y-2">
                        {item.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <button className="btn-primary rounded-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label={`Vote for ${option}`}>Vote</button>
                            <span>{option}</span>
                            <span>({item.votes.filter(v => v.option === option).length} votes)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-holo-gray text-sm mt-1">Posted by {item.author}</p>
                  </>
                )}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => handleLike(index)}
                    className="flex items-center gap-1 text-holo-blue hover:text-holo-pink transition-colors focus:outline-none focus:ring-2 focus:ring-holo-blue animate-pulse-on-hover"
                    aria-label={`Like this update (${item.likes} likes)`}
                  >
                    <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {item.likes} Likes
                  </button>
                  <button
                    onClick={() => toggleComments(index)}
                    className="flex items-center gap-1 text-holo-blue hover:text-holo-pink transition-colors focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Toggle comments"
                  >
                    <MessageSquare className="w-5 h-5" aria-hidden="true" /> {item.comments.length} Comments
                  </button>
                  <button
                    onClick={() => handleShare(index)}
                    className="flex items-center gap-1 text-holo-blue hover:text-holo-pink transition-colors focus:outline-none focus:ring-2 focus:ring-holo-blue"
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
                          <div key={cIndex} className="comment p-2 bg-holo-bg-light rounded">
                            <p className="text-holo-gray text-sm">
                              <strong>{comment.user}:</strong> {comment.text}
                            </p>
                            <p className="text-holo-gray text-xs">{new Date(comment.timestamp).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-holo-gray text-sm">No comments yet.</p>
                    )}
                    <form onSubmit={(e) => handleCommentSubmit(index, e)} className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newComment[index] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [index]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                        aria-label="Add a comment"
                      />
                      <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Submit comment">
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
  );
};

export default Home;