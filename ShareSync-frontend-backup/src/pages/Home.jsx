import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setLocalUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in.');
        }

        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error('Received non-JSON response from server. Please check the API endpoint.');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user details');
        }

        const userData = await response.json();
        setLocalUser(userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        if (err.message.includes('No token found') || err.message.includes('Invalid token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(`Failed to load user data: ${err.message}. Displaying default content.`);
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setLocalUser(JSON.parse(savedUser));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, setUser]);

  if (loading) {
    return (
      <div className="text-white text-center mt-10 flex items-center justify-center space-x-2 animate-shimmer">
        <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {error && (
        <div className="text-center mt-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-accent-orange flex items-center justify-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>{error}</span>
          </p>
        </div>
      )}
      <div className="text-center mb-8 pt-10">
        <h2 className="text-2xl font-display text-primary-blue flex items-center justify-center space-x-2">
          <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span>ShareSync: Real-Time Collaboration for Student Projects</span>
        </h2>
      </div>
      <h1 className="text-3xl font-display text-primary-blue flex items-center justify-center space-x-2">
        <svg className="w-8 h-8 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        <span>Welcome, {user?.username || 'User'}!</span>
      </h1>
      <div className="text-center mt-6">
        <p className="text-neutral-gray text-lg">
          Get started by joining or creating a project to collaborate with your team in real-time.
        </p>
        <Link to="/projects" className="mt-4 inline-block btn-primary neumorphic hover:scale-105 transition-transform flex items-center justify-center space-x-2 border border-muted-purple">
          <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <caveat className="text-white">View Projects</caveat>
        </Link>
      </div>
    </div>
  );
};

export default Home;