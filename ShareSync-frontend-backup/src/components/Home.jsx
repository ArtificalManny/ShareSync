import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const { user, logout } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        console.log('Home - Fetched projects:', data);
        setProjects(data);
      } catch (error) {
        console.error('Home - Error fetching projects:', error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Home - Error fetching notifications:', error);
      }
    };

    const fetchTeamActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teamActivity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch team activity');
        const data = await response.json();
        setTeamActivity(data);
      } catch (error) {
        console.error('Home - Error fetching team activity:', error);
      }
    };

    if (user) {
      fetchProjects();
      fetchNotifications();
      fetchTeamActivity();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLike = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teamActivity/${activityId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to like activity');
      const updatedActivity = await response.json();
      setTeamActivity(teamActivity.map(activity => (activity._id === activityId ? updatedActivity : activity)));
    } catch (error) {
      console.error('Home - Error liking activity:', error);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh',
      fontFamily: "'Arial', sans-serif"
    }}>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: '#16213e', 
        padding: '10px', 
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        marginBottom: '20px'
      }}>
        <div>
          <Link to="/" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px', fontWeight: 'bold' }}>ShareSync</Link>
          <Link to="/" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Home</Link>
          <Link to="/login" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Login</Link>
          <Link to="/register" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Register</Link>
          <Link to="/projects" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Projects</Link>
          {user && <Link to="/profile" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Profile</Link>}
          {user && <button onClick={handleLogout} style={{ color: '#e94560', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>}
        </div>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            backgroundColor: '#e94560', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '5px', 
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
        >
          Toggle Theme
        </button>
      </nav>

      {user ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '20px' }}>
          {/* Notifications */}
          <div style={{ 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
            width: '20%', 
            marginBottom: '20px',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>
              Notifications ({notifications.length})
              <Link to="/notifications" style={{ color: '#e94560', textDecoration: 'none', float: 'right', fontSize: '14px' }}>View All</Link>
            </h3>
            {notifications.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              notifications.slice(0, 3).map((notification, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#0f3460', borderRadius: '5px' }}>
                  <p style={{ margin: 0 }}>{notification.message}</p>
                  <small style={{ color: '#a0a0a0' }}>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>

          {/* Create a New Project */}
          <div style={{ 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
            width: '35%', 
            marginBottom: '20px',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>Create a New Project</h3>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Project Name"
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
            <div style={{ marginBottom: '15px' }}>
              <textarea
                placeholder="Description"
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
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Share with (email)"
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
              onClick={() => navigate('/create-project')}
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#0f3460', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0f3460'}
            >
              Create Project
            </button>
          </div>

          {/* Project Overview */}
          <div style={{ 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
            width: '35%', 
            marginBottom: '20px',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>Project Overview</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #0f3460 0%, #1a4b84 100%)', 
                padding: '10px', 
                borderRadius: '5px', 
                textAlign: 'center', 
                width: '30%',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <h4 style={{ color: '#e94560' }}>Total Projects</h4>
                <p style={{ fontSize: '24px', margin: 0 }}>{projects.length}</p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #0f3460 0%, #1a4b84 100%)', 
                padding: '10px', 
                borderRadius: '5px', 
                textAlign: 'center', 
                width: '30%',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <h4 style={{ color: '#e94560' }}>Current Projects</h4>
                <p style={{ fontSize: '24px', margin: 0 }}>{projects.filter(p => !p.completed).length}</p>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #0f3460 0%, #1a4b84 100%)', 
                padding: '10px', 
                borderRadius: '5px', 
                textAlign: 'center', 
                width: '30%',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <h4 style={{ color: '#e94560' }}>Past Projects</h4>
                <p style={{ fontSize: '24px', margin: 0 }}>{projects.filter(p => p.completed).length}</p>
              </div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div style={{ 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
            width: '20%', 
            marginBottom: '20px',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>Tasks Completed</h3>
            <p style={{ fontSize: '24px', textAlign: 'center', margin: 0 }}>{projects.reduce((total, project) => total + (project.tasksCompleted || 0), 0)}</p>
          </div>

          {/* Team Activity */}
          <div style={{ 
            backgroundColor: '#16213e', 
            padding: '20px', 
            borderRadius: '10px', 
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
            width: '100%',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#e94560', marginBottom: '10px' }}>
              Team Activity
              <Link to="/teamActivity" style={{ color: '#e94560', textDecoration: 'none', float: 'right', fontSize: '14px' }}>View All</Link>
            </h3>
            {teamActivity.length === 0 ? (
              <p>No recent updates.</p>
            ) : (
              teamActivity.slice(0, 5).map((activity, index) => (
                <div key={index} style={{ 
                  marginBottom: '10px', 
                  padding: '10px', 
                  backgroundColor: '#0f3460', 
                  borderRadius: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a4b84'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f3460'}
                >
                  <div>
                    <p style={{ margin: 0 }}>{activity.message}</p>
                    <small style={{ color: '#a0a0a0' }}>{new Date(activity.createdAt).toLocaleString()}</small>
                  </div>
                  <button
                    onClick={() => handleLike(activity._id)}
                    style={{
                      backgroundColor: '#e94560',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
                  >
                    Like ({activity.likes || 0})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Please login or register to continue.</p>
          <Link to="/login" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Login</Link>
          <Link to="/register" style={{ color: '#e94560', textDecoration: 'none' }}>Register</Link>
        </div>
      )}
    </div>
  );
};

export default Home;