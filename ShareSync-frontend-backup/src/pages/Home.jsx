import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Menu, X, Users, Award } from 'lucide-react';
import FeedItem from '../components/FeedItem';
import { fetchLeaderboard } from '../services/project.js';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, socket, fetchUserData } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchFeedItems = () => {
      try {
        const activeProjects = (user.projects || []).filter(project => project && project.status && project.status !== 'Completed');

        const allFeedItems = activeProjects.flatMap(project => {
          const activityLogs = (project.activityLog || []).map(log => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'activity',
            message: log.message || 'Unknown activity',
            user: log.user || 'Unknown user',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: log.timestamp || new Date().toISOString(),
            userId: log.userId || null,
          }));

          const posts = (project.posts || []).map(post => ({
            projectId: project._id,
            projectTitle: project.title,
            type: post.type || 'announcement',
            content: post.content || 'No content',
            author: post.author || 'Unknown author',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: post.timestamp || new Date().toISOString(),
            votes: post.votes || [],
            options: post.options || [],
            userId: post.userId || null,
          }));

          const tasks = (project.tasks || []).filter(task => task.status === 'Completed').map(task => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'task-complete',
            message: `${task.title || 'Unnamed task'} completed`,
            user: task.assignedTo || 'Unassigned',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: task.updatedAt || new Date().toISOString(),
            userId: task.userId || null,
          }));

          const files = (project.files || []).map(file => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'file',
            message: `Shared file: ${file.name || 'Unnamed file'}`,
            user: file.uploadedBy || 'Unknown user',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: file.uploadedAt || new Date().toISOString(),
            url: file.url || '#',
            userId: file.userId || null,
          }));

          return [...activityLogs, ...posts, ...tasks, ...files].map(item => ({
            ...item,
            likes: item.likes || 0,
            comments: item.comments || [],
            shares: item.shares || 0,
          }));
        });

        allFeedItems.sort((a, b) => new Date(b.timestamp || new Date()) - new Date(a.timestamp || new Date()));
        setFeedItems(allFeedItems);

        const recommendProjects = () => {
          const projectsWithActivity = activeProjects.map(project => {
            const latestActivity = [
              ...(project.activityLog || []),
              ...(project.posts || []),
              ...(project.tasks || []),
              ...(project.files || []),
            ].map(item => item.timestamp || new Date().toISOString())
             .sort((a, b) => new Date(b) - new Date(a))[0];

            const userInteractionCount = (project.activityLog || []).filter(log => log.user === user.email).length;

            return {
              id: project._id,
              title: project.title,
              latestActivity: latestActivity || new Date().toISOString(),
              userInteractionCount,
              hasUserInteraction: userInteractionCount > 0,
            };
          });

          const recommendations = projectsWithActivity
            .sort((a, b) => {
              if (a.hasUserInteraction && !b.hasUserInteraction) return 1;
              if (!a.hasUserInteraction && b.hasUserInteraction) return -1;
              if (a.userInteractionCount !== b.userInteractionCount) {
                return b.userInteractionCount - a.userInteractionCount;
              }
              return new Date(b.latestActivity) - new Date(a.latestActivity);
            })
            .slice(0, 3)
            .map(project => ({
              id: project.id,
              title: project.title,
              reason: project.hasUserInteraction
                ? 'You’ve been active here recently'
                : 'Active project with recent updates',
            }));

          setRecommendedProjects(recommendations);
        };

        recommendProjects();

        const fetchLeaderboards = async () => {
          try {
            const projectLeaderboards = await Promise.all(
              activeProjects.map(async (project) => {
                const response = await fetchLeaderboard(project._id);
                return response;
              })
            );

            const aggregated = {};
            projectLeaderboards.forEach(leaderboard => {
              leaderboard.forEach(entry => {
                if (aggregated[entry.email]) {
                  aggregated[entry.email].points += entry.points;
                } else {
                  aggregated[entry.email] = { ...entry };
                }
              });
            });

            const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 5);
            setLeaderboard(leaderboardArray);
          } catch (err) {
            setLeaderboard([]);
          }
        };

        fetchLeaderboards();
      } catch (err) {
        setError('Failed to load feed items: ' + (err.message || 'Please try again.'));
        setFeedItems([]);
      }
    };

    fetchFeedItems();

    if (socket) {
      socket.on('project-updated', () => {
        fetchUserData();
      });

      socket.on('feed-update', (data) => {
        setFeedItems((prev) => {
          const updatedItems = [...prev, data].sort(
            (a, b) => new Date(b.timestamp || new Date()) - new Date(a.timestamp || new Date())
          );
          return updatedItems;
        });
      });

      return () => {
        socket.off('project-updated');
        socket.off('feed-update');
      };
    }
  }, [isAuthenticated, isLoading, navigate, user, socket, fetchUserData]);

  const handleLike = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );
    if (socket) {
      socket.emit('feed-like', { item: feedItems[index], userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} liked your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
    }
  };

  const handleCommentSubmit = (index, e) => {
    e.preventDefault();
    const commentText = newComment[index] || '';
    if (!commentText.trim()) return;

    const newCommentData = {
      text: commentText,
      user: user.email || 'Anonymous',
      userId: user._id,
      username: user.username,
      profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
      timestamp: new Date().toISOString(),
    };

    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, comments: [...(item.comments || []), newCommentData] }
          : item
      )
    );
    setNewComment(prev => ({ ...prev, [index]: '' }));
    setExpandedComments(prev => ({ ...prev, [index]: true }));

    if (socket) {
      socket.emit('feed-comment', { item: feedItems[index], comment: newCommentData, userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} commented on your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
    }
  };

  const handleShare = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, shares: (item.shares || 0) + 1 } : item
      )
    );
    alert('Shared! (This is a mock action—implement sharing logic as needed.)');
    if (socket) {
      socket.emit('feed-share', { item: feedItems[index], userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} shared your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
    }
  };

  const toggleComments = (index) => {
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-crimson-red text-lg font-orbitron flex items-center gap-2">
            <AlertCircle className="w-5 h-5 animate-bounce" aria-hidden="true" /> {authError || error}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-saffron-yellow text-lg font-orbitron">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <div className={`sidebar fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white bg-opacity-10 p-4 flex flex-col gap-4 lg:flex glassmorphic animate-slide-down`}>
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-xl font-orbitron font-semibold text-emerald-green">Activity Summary</h2>
          <button
            className="lg:hidden text-charcoal-gray focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <X className="w-6 h-6 animate-orbit" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {(user.projects || []).filter(p => p.status !== 'Completed').slice(0, 5).map(project => (
              <div key={project._id} className="sidebar-item p-3 bg-saffron-yellow bg-opacity-20 rounded-lg holographic-effect animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${user.username}'s profile`}
                      className="w-8 h-8 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
                  </div>
                  <div>
                    <Link to={`/projects/${project._id}`} className="text-charcoal-gray font-inter font-medium hover:underline">{project.title}</Link>
                    <p className="text-lavender-gray text-sm font-inter">Status: {project.status}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-charcoal-gray animate-orbit" />
                      <span className="text-lavender-gray text-xs font-inter">{project.members?.length || 0} active users</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-4 lg:p-8">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <button
            className="lg:hidden text-charcoal-gray focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6 animate-orbit" />
          </button>
        </div>

        <div className="home-header mb-8 glassmorphic p-6 rounded-2xl animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/40'}
                alt={`${user.firstName}'s profile`}
                className="w-10 h-10 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-orbitron font-bold text-emerald-green mb-2 animate-pulse">
              Welcome to ShareSync, {user.firstName}!
            </h1>
          </div>
          <p className="text-saffron-yellow text-lg font-inter animate-fade-in">
            Stay connected with all your active projects in a modern workspace.
          </p>
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-8 card p-6 glassmorphic holographic-effect card-3d animate-slide-down">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-charcoal-gray animate-pulse" aria-hidden="true" /> Overall Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No leaderboard data available.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item card p-3 glassmorphic flex justify-between items-center animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={entry.profilePicture || 'https://via.placeholder.com/32'}
                        alt={`${entry.username}'s profile`}
                        className="w-8 h-8 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
                    </div>
                    <span className={`text-xl font-orbitron ${index === 0 ? 'text-crimson-red' : index === 1 ? 'text-saffron-yellow' : 'text-indigo-vivid'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-lavender-gray font-inter">{entry.username}</span>
                  </div>
                  <span className="text-lavender-gray font-inter">{entry.points} points</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        {recommendedProjects.length > 0 && (
          <div className="recommendations-section mb-8">
            <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 animate-slide-down">Recommended Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="recommendation-card card p-4 glassmorphic animate-fade-in holographic-effect card-3d"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h3 className="text-lg font-orbitron font-medium text-indigo-vivid">{project.title}</h3>
                  <p className="text-saffron-yellow text-sm font-inter">{project.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feed Section */}
        <div className="feed-container">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-6 flex items-center animate-slide-down">
            <Folder className="w-5 h-5 mr-2 text-charcoal-gray animate-orbit" aria-hidden="true" /> Project Activity Feed
          </h2>
          {feedItems.length === 0 ? (
            <p className="text-saffron-yellow flex items-center gap-2 font-inter animate-fade-in">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No recent activity in your active projects.
            </p>
          ) : (
            <div className="space-y-6">
              {feedItems.map((item, index) => (
                <div key={index} className="animate-fade-in">
                  <FeedItem
                    item={item}
                    index={index}
                    newComment={newComment}
                    expandedComments={expandedComments}
                    handleLike={handleLike}
                    handleCommentSubmit={handleCommentSubmit}
                    toggleComments={toggleComments}
                    handleShare={handleShare}
                    user={user}
                    setNewComment={setNewComment}
                  />
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