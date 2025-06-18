import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ Keep this import the same
import { AuthContext } from '../AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔁 CHANGE: use login() instead of broken setAuthState
  const { login } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Instead of manually setting localStorage or auth state, use context method
        login(data.access_token, null, { email, _id: data.userId || 'user1' });

        // Optional: log token for debugging
        console.log('Login successful. Token:', data.access_token);

        navigate('/');
      } else {
        alert('Login failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;