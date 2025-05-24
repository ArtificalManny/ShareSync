import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import './ProjectHome.css';

const socket = io('http://localhost:3000');

const mockProject = {
  id: '1',
  title: 'Project Alpha',
  description: 'A revolutionary project to change the world.',
  status: 'In Progress',
  comments: [
    { text: 'Great progress so far!', user: 'Alice', timestamp: new Date().toISOString() },
  ],
};

const ProjectHome = () => {
  console.log('ProjectHome - Starting render');

  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  if (!authContext) {
    return (
      <div className="project-home-container">
        <p className="text-error">Authentication context is not available.</p>
      </div>
    );
  }

  const { isAuthenticated, user } = authContext;

  useEffect(() => {
    console.log('ProjectHome - useEffect, isAuthenticated:', isAuthenticated, 'id:', id);
    const fetchProject = async () => {
      try {
        if (!id) throw new Error('Project ID is missing');
        console.log('ProjectHome - Fetching project');
        setProject(mockProject);
        setComments(mockProject.comments || []);
      } catch (err) {
        console.error('ProjectHome - Error fetching project:', err.message, err.stack);
        setError('Failed to load project: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    socket.on('message', (message) => {
      if (message.projectId === id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    if (isAuthenticated) {
      fetchProject();
    } else {
      console.log('ProjectHome - Not authenticated, navigating to login');
      navigate('/login', { replace: true });
    }

    return () => socket.off('message');
  }, [id, isAuthenticated, navigate]);

  const sendMessage = () => {
    if (!newMessage) return;
    socket.emit('message', { projectId: id, text: newMessage, user: user?.email || 'Guest' });
    setNewMessage('');
  };

  const addComment = () => {
    if (!newComment) return;
    const newCommentObj = {
      text: newComment,
      user: user?.email || 'Guest',
      timestamp: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newCommentObj]);
    setNewComment('');
  };

  if (loading) {
    return <div className="project-home-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="project-home-container">
        <p className="text-error">{error}</p>
        {error.includes('token') && (
          <p className="text-secondary">
            Please <Link to="/login">log in</Link> to view this project.
          </p>
        )}
        <Link to="/projects">
          <button className="btn-primary">Back to Projects</button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return <div className="project-home-container"><p className="text-secondary">Project not found.</p></div>;
  }

  const statusProgress = project.status === 'Completed' ? 100 : project.status === 'In Progress' ? 50 : 0;

  return (
    <div className="project-home-container">
      <div className="project-home-header">
        <h1>{project.title || 'Untitled'}</h1>
      </div>
      <div className="project-details">
        <p className="text-secondary">{project.description || 'No description'}</p>
        <div className="project-overview">
          <h2>Project Overview</h2>
          <div className="overview-infographic">
            <div className="stat-bar">
              <span>
                <CheckCircle className="icon" /> Status: {project.status || 'Unknown'}
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill gradient-bg"
                  style={{ width: `${statusProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="chat-section">
        <h2><MessageSquare className="icon" /> Project Chat</h2>
        <div className="messages holographic">
          {messages.map((msg, index) => (
            <div key={index} className="message-item">
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="btn-primary">Send</button>
        </div>
      </div>
      <div className="comments-section">
        <h2>Comments</h2>
        <div className="comments-list">
          {comments.map((comment, index) => (
            <div key={index} className="comment-item holographic">
              <p>{comment.text}</p>
              <p className="text-secondary">By {comment.user} on {new Date(comment.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="comment-input">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <button onClick={addComment} className="btn-primary">Post</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;