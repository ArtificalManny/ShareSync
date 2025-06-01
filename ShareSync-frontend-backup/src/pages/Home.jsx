import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});

  useEffect(() => {
    if (isLoading) {
      console.log('Home - Waiting for AuthContext to finish loading');
      return;
    }

    if (!isAuthenticated) {
      console.log('Home - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      console.log('Home - User data not available');
      navigate('/login', { replace: true });
      return;
    }

    // Compile feed items from all active projects
    const activeProjects = user.projects.filter(project => project.status !== 'Completed');
    const allFeedItems = activeProjects.flatMap(project => {
      const activityLogs = (project.activityLog || []).map(log => ({
        projectId: project.id,
        projectTitle: project.title,
        type: 'activity',
        message: log.message,
        user: log.user,
        timestamp: log.timestamp,
      }));

      const posts = (project.posts || []).map(post => ({
        projectId: project.id,
        projectTitle: project.title,
        type: post.type,
        content: post.content,
        author: post.author,
        timestamp: post.timestamp,
        votes: post.votes || [],
        options: post.options || [],
      }));

      return [...activityLogs, ...posts].map(item => ({
        ...item,
        likes: 0,
        comments: [],
      }));
    });

    // Sort feed items by timestamp (most recent first)
    allFeedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setFeedItems(allFeedItems);
  }, [isAuthenticated, isLoading, navigate, user]);

  const handleLike = (index) => {
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

    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, comments: [...item.comments, { text: commentText, user: user.email, timestamp: new Date().toISOString() }] }
          : item
      )
    );
    setNewComment(prev => ({ ...prev, [index]: '' }));
  };

  if (isLoading) {
    return (
      <div className="home-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading home page"></div>
        <span className="text-holo-blue text-xl font-inter ml-4">Loading...</span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="home-container flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg font-inter">{authError}</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
          Welcome to ShareSync, {user.firstName}!
        </h1>
        <p className="text-holo-gray text-lg font-inter mb-4">
          Stay updated with all your active projects in one place.
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
                    className="flex items-center gap-1 text-holo-blue hover:text-holo-pink transition-colors focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label={`Like this update (${item.likes} likes)`}
                  >
                    <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {item.likes} Likes
                  </button>
                  <button
                    onClick={() => setNewComment(prev => ({ ...prev, [index]: prev[index] || '' }))}
                    className="flex items-center gap-1 text-holo-blue hover:text-holo-pink transition-colors focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Comment on this update"
                  >
                    <MessageSquare className="w-5 h-5" aria-hidden="true" /> {item.comments.length} Comments
                  </button>
                </div>
                {item.comments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {item.comments.map((comment, cIndex) => (
                      <div key={cIndex} className="comment p-2 bg-holo-bg-light rounded">
                        <p className="text-holo-gray text-sm">
                          <strong>{comment.user}:</strong> {comment.text}
                        </p>
                        <p className="text-holo-gray text-xs">{new Date(comment.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;