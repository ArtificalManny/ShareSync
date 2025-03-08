import React, { useState } from 'react';
import axios from 'axios';

const AuthForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`http://localhost:3000${url}`, {
        username,
        password,
        profilePic: isLogin ? undefined : profilePic,
      });
      console.log(response.data);
      alert(isLogin ? 'Login successful' : 'Registration successful');
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {!isLogin && (
          <input
            type="text"
            value={profilePic}
            onChange={(e) => setProfilePic(e.target.value)}
            placeholder="Profile Picture URL (optional)"
          />
        )}
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          Switch to {isLogin ? 'Register' : 'Login'}
        </button>
      </form>
    </main>
  );
};

export default AuthForm;