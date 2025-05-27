import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, List, MessageSquare, Users, Bell, AlertCircle, ThumbsUp, Share2, AlertTriangle, Vr, Mic } from 'lucide-react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, ScatterController, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import './ProjectHome.css';

// Register Chart.js components
ChartJS.register(ScatterController, PointElement, LinearScale, Title, Tooltip, Legend);

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, socket, isLoading: authLoading, setIntendedRoute, updateProject } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [risks, setRisks] = useState([]);
  const [vrMode, setVrMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [gestureMode, setGestureMode] = useState(false);

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

      const initializedProject = {
        ...proj,
        posts: Array.isArray(proj.posts) ? proj.posts : [],
        comments: Array.isArray(proj.comments) ? proj.comments : [],
        activityLog: Array.isArray(proj.activityLog) ? proj.activityLog : [],
        members: Array.isArray(proj.members) ? proj.members : [],
        tasks: Array.isArray(proj.tasks) ? proj.tasks : [],
        tasksCompleted: proj.tasksCompleted || 0,
        totalTasks: proj.totalTasks || 0,
      };
      setProject(initializedProject);

      const detectedRisks = [];
      if (initializedProject.tasksCompleted / (initializedProject.totalTasks || 1) < 0.3 && initializedProject.status === 'In Progress') {
        detectedRisks.push('Low progress: Project may be at risk of delay.');
      }
      if (initializedProject.members.length < 2) {
        detectedRisks.push('Limited team size: Consider adding more members.');
      }
      setRisks(detectedRisks);
    } catch (err) {
      console.error('ProjectHome - Error fetching project:', err.message, err.stack);
      setError('Failed to load project: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user, authLoading, navigate, setIntendedRoute]);

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

    const handleMessage = (message) => {
      if (message.projectId === id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.emit('joinProject', { projectId: id, user: { email: user?.email, profilePicture: user?.profilePicture } });
    socket.on('memberStatus', handleMemberStatus);
    socket.on('message', handleMessage);

    return () => {
      socket.emit('leaveProject', { projectId: id, user: { email: user?.email } });
      socket.off('memberStatus', handleMemberStatus);
      socket.off('message', handleMessage);
    };
  }, [id, socket, user, fetchProject]);

  const handleTabChange = (tab) => {
    console.log('ProjectHome - Switching to tab:', tab);
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

  const sendMessage = () => {
    if (!newMessage || !project) return;
    const message = {
      projectId: id,
      text: newMessage,
      user: user.email,
      timestamp: new Date().toISOString(),
    };
    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const enterVRMode = async () => {
    try {
      if (!navigator.xr) {
        throw new Error('WebXR not supported on this device.');
      }

      const session = await navigator.xr.requestSession('immersive-vr');
      console.log('ProjectHome - Entering VR mode:', session);
      setVrMode(true);

      alert('VR Mode: Imagine a 3D project room where tasks are floating orbs you can interact with!');

      session.addEventListener('end', () => {
        setVrMode(false);
        console.log('ProjectHome - VR session ended');
      });
    } catch (err) {
      console.error('ProjectHome - Failed to enter VR mode:', err.message);
      alert('VR Mode is not supported on this device or browser.');
    }
  };

  const handleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
      console.log('ProjectHome - Voice recognition started');
    };

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log('ProjectHome - Voice command:', command);
      setListening(false);

      if (command.includes('overview')) {
        setActiveTab('overview');
      } else if (command.includes('tasks')) {
        setActiveTab('tasks');
      } else if (command.includes('discussion')) {
        setActiveTab('discussion');
      } else if (command.includes('members')) {
        setActiveTab('members');
      } else if (command.includes('activity')) {
        setActiveTab('activity');
      } else if (command.includes('vr mode')) {
        enterVRMode();
      } else if (command.includes('create task')) {
        setNewTask(command.replace('create task', '').trim());
        handleCreateTask(command.replace('create task', '').trim());
      } else {
        alert('Command not recognized. Try saying "go to overview", "enter VR mode", or "create task [task name]".');
      }
    };

    recognition.onerror = (event) => {
      console.error('ProjectHome - Speech recognition error:', event.error);
      setListening(false);
      alert('Speech recognition error: ' + event.error);
    };

    recognition.onend = () => {
      setListening(false);
      console.log('ProjectHome - Voice recognition ended');
    };

    recognition.start();
  };

  const handleCreateTask = async (taskText) => {
    if (!taskText) return;

    // Mock NLP parsing (simplified)
    const titleMatch = taskText.match(/(.*?)(due|by|on|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : taskText;
    const dueDateMatch = taskText.match(/(due|by|on)\s+(.+)/i);
    const dueDate = dueDateMatch ? dueDateMatch[2] : 'No due date';

    const newTask = {
      title,
      description: `Due: ${dueDate}`,
      assignedTo: 'Unassigned',
      status: 'Not Started',
    };

    try {
      const updatedTasks = [...(project.tasks || []), newTask];
      await updateProject(project.id, {
        tasks: updatedTasks,
        totalTasks: (project.totalTasks || 0) + 1,
      });
      setProject((prev) => ({
        ...prev,
        tasks: updatedTasks,
        totalTasks: prev.totalTasks + 1,
      }));
      setNewTask('');
      alert(`Task created: ${title} (Due: ${dueDate})`);
    } catch (err) {
      alert('Failed to create task: ' + err.message);
    }
  };

  const handleGestureMode = () => {
    setGestureMode(true);
    alert('Gesture Mode: Swipe left to switch to the next tab, swipe right to go back.');
  };

  const handleGesture = (direction) => {
    if (!gestureMode) return;
    const tabs = ['overview', 'tasks', 'discussion', 'members', 'activity'];
    const currentIndex = tabs.indexOf(activeTab);
    let newIndex;

    if (direction === 'left') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (direction === 'right') {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    setActiveTab(tabs[newIndex]);
    console.log('ProjectHome - Gesture detected:', direction, 'New tab:', tabs[newIndex]);
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

  const chartData = {
    datasets: [
      {
        label: 'Completed Tasks',
        data: Array.from({ length: project.tasksCompleted }, () => ({
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          r: Math.random() * 5 + 3,
        })),
        backgroundColor: 'rgba(161, 181, 255, 0.8)',
        borderColor: '#A1B5FF',
        borderWidth: 1,
      },
      {
        label: 'Remaining Tasks',
        data: Array.from({ length: (project.totalTasks || 0) - project.tasksCompleted }, () => ({
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          r: Math.random() * 3 + 2,
        })),
        backgroundColor: 'rgba(255, 111, 145, 0.5)',
        borderColor: '#FF6F91',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { position: 'top' },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="project-home-container">
      <div className="project-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">{project.title}</h1>
        <p className="text-holo-gray mb-4">{project.description || 'No description'}</p>
        <div className="flex justify-center items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-holo-pink animate-pulse" />
          <span className="text-holo-gray">Online: </span>
          {onlineMembers.length > 0 ? (
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 3).map((member, index) => (
                <img
                  key={index}
                  src={member.profilePicture || 'https://via.placeholder.com/150'}
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
        <div className="flex justify-center gap-4">
          <button
            onClick={enterVRMode}
            className="btn-primary rounded-full flex items-center animate-glow"
          >
            <Vr className="w-5 h-5 mr-2" /> Enter VR Mode
          </button>
          <button
            onClick={handleVoiceCommand}
            className={`btn-primary rounded-full flex items-center ${listening ? 'animate-pulse-light' : 'animate-glow'}`}
          >
            <Mic className="w-5 h-5 mr-2" /> {listening ? 'Listening...' : 'Voice Command'}
          </button>
          <button
            onClick={handleGestureMode}
            className="btn-primary rounded-full flex items-center animate-glow"
          >
            <span role="img" aria-label="hand" className="mr-2">✋</span> Gesture Mode
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="project-tabs mb-6">
          {['overview', 'tasks', 'discussion', 'members', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              style={{ pointerEvents: 'auto', userSelect: 'none' }}
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
              <p className="text-holo-gray mb-4">
                Progress: {project.tasksCompleted} / {project.totalTasks || 0} tasks completed
              </p>

              <div className="progress-galaxy mb-6">
                <h3 className="text-lg font-inter text-holo-blue mb-2">Progress Galaxy</h3>
                <p className="text-holo-gray text-sm mb-2">Each star represents a completed task.</p>
                <div style={{ height: '300px' }}>
                  <Scatter data={chartData} options={chartOptions} />
                </div>
              </div>

              {risks.length > 0 && (
                <div className="risk-detection mb-4">
                  <h3 className="text-lg font-inter text-holo-blue mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Potential Risks
                  </h3>
                  <ul className="space-y-2">
                    {risks.map((risk, index) => (
                      <li key={index} className="text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tasks-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <List className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Tasks
              </h2>
              <div className="task-input card p-4 mb-4 glassmorphic">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Create a task (e.g., 'Design logo due next Friday')"
                    className="input-field w-full rounded-full"
                  />
                  <button
                    onClick={() => handleCreateTask(newTask)}
                    className="btn-primary rounded-full"
                  >
                    Add Task
                  </button>
                </div>
              </div>
              {project.tasks.length === 0 ? (
                <p className="text-holo-gray flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No tasks yet.
                </p>
              ) : (
                <div className="task-board grid grid-cols-1 md:grid-cols-3 gap-4">
                  {project.tasks.map((task, index) => (
                    <div key={index} className="task-card card p-4 holographic-effect glassmorphic">
                      <h3 className="text-lg font-inter text-holo-blue mb-2">{task.title || 'Untitled Task'}</h3>
                      <p className="text-holo-gray text-sm mb-2">{task.description || 'No description'}</p>
                      <p className="text-holo-gray text-sm">
                        Assigned to: {task.assignedTo || 'Unassigned'}
                      </p>
                      <p className="text-holo-gray text-sm">
                        Status: {task.status || 'Not Started'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="discussion-tab card p-6 glassmorphic">
              <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Discussion
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="posts-section">
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

                <div className="chat-section card p-4 glassmorphic holographic-effect">
                  <h3 className="text-lg font-inter text-holo-blue mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Project Chat
                  </h3>
                  <div className="messages overflow-y-auto h-64 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-holo-gray flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No messages yet.
                      </p>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className="message-item mb-2">
                          <div className="flex items-center">
                            <span className="text-primary font-semibold">{msg.user}</span>
                            <span className="text-holo-gray text-xs ml-2">{new Date(msg.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-primary">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="chat-input flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="input-field w-full rounded-full"
                    />
                    <button onClick={sendMessage} className="btn-primary rounded-full">Send</button>
                  </div>
                </div>
              </div>
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
                        src={member.profilePicture || 'https://via.placeholder.com/150'}
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