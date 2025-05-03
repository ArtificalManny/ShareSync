import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.jsx';

const ProjectHome = () => {
  const [project, setProject] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '' });
  const { id } = useParams();
  const { user } = useContext(UserContext) || {};
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('ProjectHome - Error fetching project:', error);
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setProject(data);
      setNewPost({ title: '', content: '', category: '' });
    } catch (error) {
      console.error('ProjectHome - Error adding post:', error);
    }
  };

  if (!project) return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#e94560', marginBottom: '20px' }}>{project.title}</h1>
      <p style={{ marginBottom: '20px' }}>{project.description}</p>
      {user && (
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            marginBottom: '20px', 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Post Title"
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: 'none',
                backgroundColor: '#0f3460',
                color: 'white',
                transition: 'background-color 0.3s'
              }}
              onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Post Content"
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: 'none',
                backgroundColor: '#0f3460',
                color: 'white',
                height: '100px',
                transition: 'background-color 0.3s'
              }}
              onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              placeholder="Category (optional)"
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: 'none',
                backgroundColor: '#0f3460',
                color: 'white',
                transition: 'background-color 0.3s'
              }}
              onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
            />
          </div>
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#e94560', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
          >
            Add Post
          </button>
        </form>
      )}
      <div>
        {project.posts.map((post, index) => (
          <div 
            key={index} 
            style={{ 
              backgroundColor: '#16213e', 
              padding: '10px', 
              margin: '10px 0', 
              borderRadius: '5px',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>{post.title}</h3>
            <p style={{ marginBottom: '10px' }}>{post.content}</p>
            {post.category && <p style={{ color: '#a0a0a0' }}>Category: {post.category}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectHome;