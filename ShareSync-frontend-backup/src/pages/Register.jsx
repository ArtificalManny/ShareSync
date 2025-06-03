import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, authError, setAuthError } = useContext(AuthContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthError(null);

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const success = await register(firstName, lastName, username, email, password);
    if (success) {
      navigate('/login', { replace: true });
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="register-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading register page"></div>
        <span className="text-primary-blue text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card card p-6 glassmorphic">
        <h2 className="text-3xl font-orbitron font-bold text-primary-blue mb-6 text-center">Register for ShareSync</h2>
        {(error || authError) && (
          <p className="text-error-red mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {error || authError}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" /> First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your first name"
              aria-label="First Name"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" /> Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your last name"
              aria-label="Last Name"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="username" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" /> Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your username"
              aria-label="Username"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Mail className="w-5 h-5" aria-hidden="true" /> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your email"
              aria-label="Email"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Lock className="w-5 h-5" aria-hidden="true" /> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your password"
              aria-label="Password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-gray holographic-effect"
            aria-label="Register"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-secondary-gray font-inter">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              aria-label="Go to login"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;