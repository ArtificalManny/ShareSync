import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login (replace with actual authentication logic)
    setAuthState(prev => ({
      ...prev,
      user: { _id: 'user1', username, email: `${username}@example.com`, firstName: username, profilePicture: '/default-avatar.png', projects: [{ _id: 'proj1', title: 'Project Alpha', status: 'Active' }] },
      isAuthenticated: true,
      authError: null,
    }));
    localStorage.setItem('user', JSON.stringify({ _id: 'user1', username, email: `${username}@example.com`, firstName: username, profilePicture: '/default-avatar.png', projects: [{ _id: 'proj1', title: 'Project Alpha', status: 'Active' }] }));
    navigate('/');
  };

  return (
    <div className="login-container min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex items-center justify-center p-4">
      <div className="login-card bg-white/98 dark:bg-gray-900/98 border border-gray-50 dark:border-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md shadow-md hover:shadow-lg transition-all duration-200">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-center text-gray-900 dark:text-white mb-4">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm sm:text-base font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm sm:text-base font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800" />
          <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-200">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;