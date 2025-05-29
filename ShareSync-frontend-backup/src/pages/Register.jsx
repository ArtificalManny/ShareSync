import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { User, Mail, Lock, Calendar, UserPlus } from 'lucide-react';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('Register - Component mounted. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (isAuthenticated && !isLoading) {
      console.log('Register - User is authenticated, redirecting to /');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register - Submitting form with username:', username, 'firstName:', firstName, 'lastName:', lastName, 'email:', email, 'age:', age);

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, firstName, lastName, email, age: parseInt(age), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      console.log('Register - Registration successful:', data);
      setMessage('Registration successful! Redirecting to login...');
      setError('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Register - Registration failed:', err.message);
      setError('Registration failed: ' + (err.message || 'Please try again.'));
      setMessage('');
    }
  };

  if (isLoading) {
    console.log('Register - Rendering loading state');
    return <div className="register-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  return (
    <div className="register-container">
      <div className="register-card card p-8 glassmorphic">
        <h1 className="text-3xl font-inter text-holo-blue mb-6 flex items-center justify-center animate-text-glow">
          <User className="w-6 h-6 mr-2" /> Register
        </h1>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-holo-pink" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-holo-pink" />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-holo-pink" />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-holo-pink" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-holo-pink" />
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="input-field w-full rounded-full"
              min="13"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-holo-pink" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-holo-pink" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full rounded-full animate-glow">Register</button>
        </form>
        <p className="text-holo-gray mt-4 text-center">
          Forgot your password? <Link to="/forgot-password" className="text-holo-blue hover:underline">Reset It</Link>
        </p>
        <p className="text-holo-gray mt-2 text-center">
          Already have an account? <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;