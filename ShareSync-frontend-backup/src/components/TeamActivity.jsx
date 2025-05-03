import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeamActivity = () => {
  const [teamActivity, setTeamActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/team-activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch team activity');
        const data = await response.json();
        setTeamActivity(data);
      } catch (error) {
        console.error('TeamActivity - Error fetching team activity:', error);
      }
    };

    fetchTeamActivity();
  }, []);

  const handleLike = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/team-activity/${activityId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to like activity');
      const updatedActivity = await response.json();
      setTeamActivity(teamActivity.map(activity => (activity._id === activityId ? updatedActivity : activity)));
    } catch (error) {
      console.error('TeamActivity - Error liking activity:', error);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#e94560', marginBottom: '20px', textAlign: 'center' }}>Team Activity</h1>
      <div>
        {teamActivity.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No team activity available.</p>
        ) : (
          teamActivity.map((activity, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: '#16213e', 
                padding: '10px', 
                margin: '10px 0', 
                borderRadius: '5px',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
  );
};

export default TeamActivity;