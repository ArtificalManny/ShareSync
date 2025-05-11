import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await register(formData);
      localStorage.setItem('token', response.access_token);
      navigate('/');
    } catch (err) {
      setError(`Failed to register: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-display text-vibrant-pink mb-6 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Register
          </button>
        </form>
        <p className="text-white mt-4 text-center">
          Already have an account?{' '}
          <span className="text-vibrant-pink cursor-pointer" onClick={() => navigate('/login')}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;