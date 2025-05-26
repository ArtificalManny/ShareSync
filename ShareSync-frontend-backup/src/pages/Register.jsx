import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        firstName,
        lastName,
        username,
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      login(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <h2 className="text-3xl font-inter text-holo-blue mb-6 text-center animate-text-glow">Create an Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="input-field w-full rounded-full"
                required
                tabIndex={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="input-field w-full rounded-full"
                required
                tabIndex={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input-field w-full rounded-full"
                required
                tabIndex={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input-field w-full rounded-full"
                required
                tabIndex={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field w-full rounded-full"
                required
                tabIndex={5}
              />
            </div>
            <button onClick={handleSubmit} className="btn-primary rounded-full w-full animate-glow" tabIndex={6}>Register</button>
            <p className="text-holo-gray text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-holo-blue hover:text-holo-pink transition-all" tabIndex={7}>
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;