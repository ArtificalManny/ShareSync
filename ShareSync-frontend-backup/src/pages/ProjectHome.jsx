import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, List, MessageSquare, Users, Bell, AlertCircle, ThumbsUp, Share2 } from 'lucide-react';
import './ProjectHome.css';

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, socket, isLoading: authLoading, setIntendedRoute } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]); // Real-time collaboration indicator

  // Lazy load project data
  const fetchProject = useCallback(async () => {
    try {
      if (authLoading) {
        console.log('ProjectHome - Waiting for AuthContext to finish loading');
        return;
      }

      if (!isAuthenticated) {
        console.log('ProjectHome - User not authenticated, redirecting to login');
        setIntendedRoute(`/projects/${id}`);
        navigate('/login', { replace: true });
        return;
      }

      if (!user || !user.email) {
        console.log('ProjectHome - User data not available');
        setError('User data not available. Please log in again.');
        setIntendedRoute(`/projects/${id}`);
        navigate('/login', { replace: true });
        return;
      }

      console.log('ProjectHome - Fetching project with ID:', id);
      const proj = user.projects?.find((p) => p.id === id);
      if (!proj) {
        throw new Error('Project not found');
      }

      // Initialize project properties if undefined
      const initializedProject = {
        ...proj,
        posts: Array.isArray(proj.posts) ? proj.posts : [],
        comments: Array.isArray(proj.comments) ? proj.comments : [],
        activityLog: Array.isArray(proj.activityLog) ? proj.activityLog : [],
        members: Array.isArray(proj.members) ? proj.members : [],
      };
      setProject(initializedProject);
    } catch (err) {
      console.error('ProjectHome - Error fetching project:', err.message, err.stack);
      setError('Failed to load project: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user, authLoading, navigate, setIntendedRoute]);

  // Socket events for real-time updates
  useEffect(() => {
    fetchProject();

    if (!socket) return;

    const handleMemberStatus = (statusUpdate) => {
      setOnlineMembers((prev) => {
        const updatedMembers = prev.filter((m) => m.email !== statusUpdate.email);
        if (statusUpdate.status === 'online') {
          updatedMembers.push({ email: statusUpdate.email, profilePicture: statusUpdate.profilePicture });
        }
        return updatedMembers;
      });
    };

    socket.emit('joinProject', { projectId: id, user: { email: user?.email, profilePicture: user?.profilePicture } });
    socket.on('memberStatus', handleMemberStatus);

    return () => {
      socket.emit('leaveProject', { projectId: id, user: { email: user?.email } });
      socket.off('memberStatus', handleMemberStatus);
    };
  }, [id, socket, user, fetchProject]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePost = () => {
    if (!newPost || !project) return;
    const post = {
      id: `post-${project.posts.length + 1}`,
      user: user.email,
      profilePicture: user.profilePicture,
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    setProject((prev) => ({
      ...prev,
      posts: [...prev.posts, post],
    }));
    setNewPost('');
    socket.emit('post', { projectId: id, ...post });
  };

  const handleComment = (postId) => {
    if (!newComment) return;
    const comment = {
      id: `comment-${project.comments.length + 1}`,
      postId,
      user: user.email,
      content: newComment,
      timestamp: new Date().toISOString(),
    };
    setProject((prev) => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
    setNewComment('');
  };

  const handleLike = (postId) => {
    setProject((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      ),
    }));
  };

  if (loading) return <div className="project-home-container"><p className="text-holo-gray">Loading project...</p></div>;

  if (error || !project) {
    return (
      <div className="project-home-container">
        <p className="text-red-500">{error || 'Project not found'}</p>
        {(error.includes('token') || error.includes('User data not available')) && (
          <p className="text-holo-gray">
            Please <Link to="/login" className="text-holo-blue hover:underline">log in</Link> to view this project.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="project-home-container">
      <div className="project-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">{project.title}</h1>
        <p className="text-holo-gray mb-4">{project.description || 'No description'}</p>
        {/* Real-time collaboration indicator */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-holo-pink animate-pulse" />
          <span className="text-holo-gray">Online: </span>
          {onlineMembers.length > 0 ? (
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 3).map((member, index) => (
                <img
                  key={index}
                  src={member.profilePicture}
                  alt={member.email}
                  className="w-8 h-8 rounded-full object-cover border-2 border-holo-blue"
                />
              ))}
              {onlineMembers.length > 3 && (
                <span className="w-8 h-8 rounded-full bg-holo-bg-light text-primary flex items-center justify-center text-xs border-2 border-holo-blue">
                  +{onlineMembers.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-holo-gray">No members online</span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="project-tabs mb-6">
          {['overview', 'tasks', 'discussion', 'members', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Overview
              </h2>
              <p className="text-holo-gray mb-4">Status: {project.status}</p>
              <div className="progress-bar mb-4">
                <div
                  className="progress-fill"
                  style={{ width: `${(project.tasksCompleted / (project.totalTasks || 1)) * 100}%` }}
                />
              </div>
              <p className="text-holo-gray">
                Progress: {project.tasksCompleted} / {project.totalTasks || 0} tasks completed
              </p>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tasks-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <List className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Tasks
              </h2>
              <p className="text-holo-gray">Tasks feature coming soon!</p>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="discussion-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Discussion
              </h2>
              <div className="post-input card p-4 mb-4 glassmorphic">
                <div className="flex items-center mb-2">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/150'}
                    alt="User"
                    className="w-8 h-8 rounded-full mr-2 object-cover animate-glow"
                  />
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share an update..."
                    className="input-field w-full h-16"
                  />
                </div>
                <button onClick={handlePost} className="btn-primary rounded-full animate-glow">Post</button>
              </div>
              {project.posts.length === 0 ? (
                <p className="text-holo-gray flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No posts yet.
                </p>
              ) : (
                project.posts.map((post) => (
                  <div key={post.id} className="post-item card p-4 mb-4 holographic-effect glassmorphic">
                    <div className="flex items-center mb-2">
                      <img
                        src={post.profilePicture || 'https://via.placeholder.com/150'}
                        alt="User"
                        className="w-8 h-8 rounded-full mr-2 object-cover animate-glow"
                      />
                      <div>
                        <span className="text-primary font-semibold">{post.user}</span>
                        <span className="text-holo-gray text-sm ml-2">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-primary mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center text-holo-blue hover:text-holo-pink transition-all"
                      >
                        <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes || 0}
                      </button>
                      <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
                        <MessageSquare className="w-5 h-5 mr-1" /> {project.comments.filter((c) => c.postId === post.id).length}
                      </button>
                      <button className="flex items-center text-holo-blue hover:text-holo-pink transition-all">
                        <Share2 className="w-5 h-5 mr-1" /> Share
                      </button>
                    </div>
                    <div className="comments-section mt-2">
                      {project.comments
                        .filter((c) => c.postId === post.id)
                        .map((comment) => (
                          <div key={comment.id} className="comment-item card p-2 mt-2 glassmorphic">
                            <div className="flex items-center mb-1">
                              <img
                                src={user?.profilePicture || 'https://via.placeholder.com/150'}
                                alt="User"
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                              <span className="text-primary font-semibold">{comment.user}</span>
                              <span className="text-holo-gray text-xs ml-2">{new Date(comment.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-primary text-sm">{comment.content}</p>
                          </div>
                        ))}
                      <div className="comment-input mt-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="input-field w-full rounded-full"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="btn-primary rounded-full mt-2"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Members
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.members.map((member, index) => (
                  <div key={index} className="member-item card p-4 glassmorphic">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.profilePicture}
                        alt={member.email}
                        className="w-10 h-10 rounded-full object-cover animate-glow"
                      />
                      <div>
                        <p className="text-primary font-semibold">{member.email}</p>
                        <p className="text-holo-gray text-sm">{member.role || 'Member'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Activity Log
              </h2>
              {project.activityLog.length === 0 ? (
                <p className="text-holo-gray flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No activity yet.
                </p>
              ) : (
                project.activityLog.map((activity, index) => (
                  <div key={index} className="activity-item card p-3 mb-2 glassmorphic">
                    <p className="text-primary">{activity.message}</p>
                    <p className="text-holo-gray text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;