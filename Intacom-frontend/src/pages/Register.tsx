import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: '',
    birthday: { month: '', day: '', year: '' },
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('birthday')) {
      const [_, field] = name.split('.');
      setFormData({
        ...formData,
        birthday: { ...formData.birthday, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, formData);
      navigate('/login');
      alert('Registration successful! Please log in.');
    } catch (error: any) {
      console.error('Error registering:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register">
      <h1 style={{ color: theme.colors.primary }}>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="gender"
          placeholder="Gender"
          value={formData.gender}
          onChange={handleChange}
        />
        <input
          type="text"
          name="birthday.month"
          placeholder="Birth Month"
          value={formData.birthday.month}
          onChange={handleChange}
        />
        <input
          type="text"
          name="birthday.day"
          placeholder="Birth Day"
          value={formData.birthday.day}
          onChange={handleChange}
        />
        <input
          type="text"
          name="birthday.year"
          placeholder="Birth Year"
          value={formData.birthday.year}
          onChange={handleChange}
        />
        <button type="submit" style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
          Register
        </button>
      </form>
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;