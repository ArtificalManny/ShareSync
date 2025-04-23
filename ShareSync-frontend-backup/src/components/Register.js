import React, { useState } from 'react';
import { register } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    gender: '',
    birthday: { month: '', day: '', year: '' },
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('birthday.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        birthday: { ...formData.birthday, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Birthday</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              name="birthday.month"
              placeholder="Month"
              value={formData.birthday.month}
              onChange={handleChange}
              required
              style={{ width: '33%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
            <input
              type="text"
              name="birthday.day"
              placeholder="Day"
              value={formData.birthday.day}
              onChange={handleChange}
              required
              style={{ width: '33%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
            <input
              type="text"
              name="birthday.year"
              placeholder="Year"
              value={formData.birthday.year}
              onChange={handleChange}
              required
              style={{ width: '33%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
          </div>
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Register
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Register;