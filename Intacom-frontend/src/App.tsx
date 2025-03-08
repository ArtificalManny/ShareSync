import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`http://localhost:3000${url}`, {
        username,
        password,
        email: isLogin ? undefined : email,
        name: isLogin ? undefined : name,
        age: isLogin ? undefined : parseInt(age),
        profilePic: isLogin ? undefined : profilePic,
      });
      setUser(response.data.user);
      alert(isLogin ? 'Login successful' : 'Registration successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setName('');
    setAge('');
    setProfilePic('');
    navigate('/');
  };

  const handleRecoverPassword = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/auth/recover`, { params: { email } });
      alert(response.data.message);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <>
      <header>
        <Link to="/">
          <img src="https://via.placeholder.com/40?text=Intacom" alt="Intacom Logo" />
        </Link>
      </header>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {user && (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/upload">Upload</Link></li>
            </>
          )}
        </ul>
      </nav>
      <main>
        {!user ? (
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {!isLogin && (
              <>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  required
                />
                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                  id="profilePic"
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="Profile Picture URL (optional)"
                />
              </>
            )}
            <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              Switch to {isLogin ? 'Register' : 'Login'}
            </button>
            {!isLogin && (
              <button type="button" onClick={handleRecoverPassword}>
                Forgot Password?
              </button>
            )}
          </form>
        ) : (
          <div>
            <h2>Welcome, {user.name || user.username}!</h2>
            <p>Email: {user.email} | Age: {user.age}</p>
            {user.profilePic && <img src={user.profilePic} alt="Profile" style={{ maxWidth: '100px' }} />}
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </main>
      <div style={{ gridArea: 'sidebar' }}>
        <h3>Sidebar</h3>
        <p>Notifications or quick links could go here.</p>
      </div>
      <footer>
        <p>© 2025 Intacom. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;