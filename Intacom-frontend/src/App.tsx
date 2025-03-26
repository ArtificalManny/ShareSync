import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUserCircle, faPlusCircle, faHome, faFolder, faUpload, faCog, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import Upload from './Upload';
import Settings from './Settings';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';

// Define User type
interface User {
  _id?: string;
  firstName?: string;
  username: string;
  email?: string;
  profilePic?: string;
  coverPhoto?: string;
  bio?: string;
  school?: string;
  occupation?: string;
  hobbies?: string[];
}

// Define Project type
interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

// Define Notification type
interface Notification {
  _id: string;
  message: string;
  createdAt: string;
}

// Define Axios response types
interface RegisterResponse {
  data: {
    user: User;
    message: string;
  };
}

interface LoginResponse {
  data?: {
    user: User;
  };
  _id?: string;
  firstName?: string;
  username?: string;
  email?: string;
  profilePic?: string;
}

interface RecoverResponse {
  data: {
    message: string;
    token: string;
  };
}

interface ResetResponse {
  data: {
    message: string;
    user: User;
  };
}

interface ProjectResponse {
  data: {
    project: Project;
  };
}

interface ProjectsResponse {
  data?: Project[];
  [key: number]: Project;
  length?: number;
}

interface NotificationsResponse {
  data: Notification[];
}

const App: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showRecover, setShowRecover] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [sharedUsers, setSharedUsers] = useState<{ email: string; role: 'Admin' | 'Editor' | 'Viewer' }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Fetch projects and notifications when user logs in, but only navigate to /home on initial login
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      navigate('/home');
    }
    if (user) {
      const fetchProjects = async () => {
        try {
          const response = await axios.get<ProjectsResponse>(`http://localhost:3000/projects/${user.username}`);
          const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
          setProjects(projectsData);
        } catch (error: any) {
          console.error('Failed to fetch projects:', error.response?.data || error.message);
          setProjects([]);
          setErrorMessage(error.response?.data?.error || 'Failed to fetch projects. Please ensure the backend server is running.');
        }
      };
      const fetchNotifications = async () => {
        try {
          const response = await axios.get<NotificationsResponse>(`http://localhost:3000/notifications/${user._id}`);
          setNotifications(response.data.data || []);
        } catch (error: any) {
          console.error('Failed to fetch notifications:', error.response?.data || error.message);
          setNotifications([]);
        }
      };
      fetchProjects();
      fetchNotifications();
    }
  }, [user, navigate]);

  // Handle profile picture upload
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const profilePicUrl = response.data.url;
        const updatedUser = { ...user, profilePic: profilePicUrl };
        const responseUser = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
        const newUserData = responseUser.data.data.user;
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
      } catch (error: any) {
        console.error('Profile picture upload error:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'An error occurred during profile picture upload. Please ensure the backend server is running.');
      }
    }
  };

  // Handle form submission for login and registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { identifier, password }
        : {
            firstName,
            lastName,
            username,
            password,
            email,
            gender,
            birthday,
            profilePic,
          };
      if (isLogin) {
        const response = await axios.post<LoginResponse>(`http://localhost:3000${url}`, payload);
        let userData: User;
        if (response.data && 'data' in response.data && response.data.data && response.data.data.user) {
          userData = response.data.data.user;
        } else if (response.data && 'username' in response.data) {
          userData = response.data as User;
        } else {
          console.error('Login response does not contain user data:', response.data);
          setErrorMessage('Login failed: Invalid response from server');
          return;
        }
        setUser(userData);
      } else {
        const response = await axios.post<RegisterResponse>(`http://localhost:3000${url}`, payload);
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setShowCreateProject(true);
        } else {
          console.error('Register response does not contain user data:', response.data);
          setErrorMessage('Registration failed: Invalid response from server');
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during login/registration. Please check if the backend server is running.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setIdentifier('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setGender('');
    setBirthday({ month: '', day: '', year: '' });
    setProfilePic('');
    navigate('/');
  };

  // Handle password recovery
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.get<RecoverResponse>(`http://localhost:3000/auth/recover`, { params: { email: recoveryEmail } });
      alert(response.data.message + ' (Token: ' + response.data.token + '). Enter the token below.');
      setShowRecover(false);
      setShowReset(true);
    } catch (error: any) {
      console.error('Recover password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during password recovery. Please check if the backend server is running.');
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.put<ResetResponse>(`http://localhost:3000/auth/reset`, { token: recoveryToken, newPassword });
      alert(response.data.message);
      setShowReset(false);
      setRecoveryEmail('');
      setRecoveryToken('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during password reset. Please check if the backend server is running.');
    }
  };

  // Handle adding a user to share the project with
  const handleAddSharedUser = (email: string, role: 'Admin' | 'Editor' | 'Viewer') => {
    setSharedUsers([...sharedUsers, { email, role }]);
  };

  // Handle removing a shared user
  const handleRemoveSharedUser = (email: string) => {
    setSharedUsers(sharedUsers.filter((user) => user.email !== email));
  };

  // Handle project creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.post<ProjectResponse>(`http://localhost:3000/projects`, {
        name: projectName,
        description: projectDescription,
        admin: user?.username,
        color: projectColor,
        sharedWith: sharedUsers.map((u) => ({ userId: u.email, role: u.role })),
      });
      const newProject = response.data.project;
      setProjects([...projects, newProject]);
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
      setProjectColor('');
      setSharedUsers([]);
      navigate(`/project/${newProject._id}`);
    } catch (error: any) {
      console.error('Create project error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during project creation. Please check if the backend server is running.');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <>
      <header className="header-modern">
        <Link to="/">
          <img src="https://via.placeholder.com/40?text=Intacom" alt="Intacom Logo" />
        </Link>
        {user && (
          <div className="top-right">
            <div className="notifications">
              <FontAwesomeIcon
                icon={faBell}
                className="bell"
                onClick={() => setShowNotifications(!showNotifications)}
              />
              {notifications.length > 0 && (
                <span className="notification-count">{notifications.length}</span>
              )}
              {showNotifications && (
                <div className="notification-dropdown glassmorphic">
                  <h4>Notifications</h4>
                  {notifications.length === 0 ? (
                    <p>No new notifications</p>
                  ) : (
                    <ul>
                      {notifications.map((notification) => (
                        <li key={notification._id}>
                          {notification.message} - {new Date(notification.createdAt).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="user-profile">
              <Link to="/profile">
                <span>{user.firstName || user.username}</span>
                {user.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="profile-pic" />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
                )}
              </Link>
            </div>
          </div>
        )}
      </header>
      {user && (
        <aside className="sidebar-modern glassmorphic">
          <div className="profile-section">
            <Link to="/profile">
              <label htmlFor="profilePicUpload" className="profile-pic-label">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="profile-pic" />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
                )}
                <input
                  id="profilePicUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <h3>{user.firstName || user.username}</h3>
            </Link>
          </div>
          <ul>
            <li>
              <FontAwesomeIcon icon={faPlusCircle} className="menu-icon" />
              <a href="#" onClick={() => setShowCreateProject(true)}>
                Create Project
              </a>
            </li>
            <li>
              <FontAwesomeIcon icon={faHome} className="menu-icon" />
              <Link to="/home">Home</Link>
            </li>
            <li>
              <FontAwesomeIcon icon={faFolder} className="menu-icon" />
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <FontAwesomeIcon icon={faUpload} className="menu-icon" />
              <Link to="/upload">Upload</Link>
            </li>
            <li>
              <FontAwesomeIcon icon={faCog} className="menu-icon" />
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <FontAwesomeIcon icon={faSignOutAlt} className="menu-icon" />
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            </li>
          </ul>
          {projects.map((project) => (
            <div
              key={project._id}
              className="project-link glassmorphic"
              style={{
                background: project.color || '#3a3a50',
              }}
            >
              <Link to={`/project/${project._id}`}>
                {project.name}
              </Link>
            </div>
          ))}
        </aside>
      )}
      <main className={user ? 'main-modern' : 'full-screen'}>
        {user ? (
          <Routes>
            <Route path="/" element={<div>Redirecting to login...</div>} />
            <Route
              path="/home"
              element={
                <Home
                  projects={projects}
                  showCreateProject={showCreateProject}
                  setShowCreateProject={setShowCreateProject}
                  projectName={projectName}
                  setProjectName={setProjectName}
                  projectDescription={projectDescription}
                  setProjectDescription={setProjectDescription}
                  projectColor={projectColor}
                  setProjectColor={setProjectColor}
                  sharedUsers={sharedUsers}
                  handleAddSharedUser={handleAddSharedUser}
                  handleRemoveSharedUser={handleRemoveSharedUser}
                  handleCreateProject={handleCreateProject}
                />
              }
            />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/upload" element={<Upload projects={projects} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/project/:id" element={<ProjectHome projects={projects} />} />
            <Route path="/profile" element={<Profile setUser={setUser} />} />
          </Routes>
        ) : (
          <form onSubmit={handleSubmit} className="glassmorphic">
            <h2 style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 'bold', fontSize: '2.5rem', color: '#6A5ACD', textAlign: 'center', marginBottom: '0.5rem' }}>
              Intacom
            </h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {isLogin ? (
              <>
                <label htmlFor="identifier">Email or Username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Username"
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
                <button type="submit" className="neumorphic">Login</button>
                <button type="button" className="neumorphic" onClick={() => setShowRecover(true)}>
                  Forgot Password?
                </button>
                <button type="button" className="neumorphic" onClick={() => setIsLogin(!isLogin)}>
                  Switch to Register
                </button>
              </>
            ) : (
              <>
                <div className="subtitle">Create an account</div>
                <div className="name-container">
                  <div>
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>
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
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <label>Birthday</label>
                <div className="birthday-container">
                  <select
                    value={birthday.month}
                    onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
                    required
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={birthday.day}
                    onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
                    required
                  >
                    <option value="">Day</option>
                    {days.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={birthday.year}
                    onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
                    required
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                  id="profilePic"
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="Profile Picture URL (optional)"
                />
                <button type="submit" className="neumorphic">Register</button>
                <button type="button" className="neumorphic" onClick={() => setShowRecover(true)}>
                  Forgot Password?
                </button>
                <button type="button" className="neumorphic" onClick={() => setIsLogin(!isLogin)}>
                  Switch to Login
                </button>
              </>
            )}
          </form>
        )}
        {showRecover && (
          <div className="modal glassmorphic">
            <h3>Forgot Password</h3>
            <form onSubmit={handleRecoverPassword}>
              <label htmlFor="recoveryEmail">Email Address</label>
              <input
                id="recoveryEmail"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit" className="neumorphic">Recover Password</button>
              <button type="button" className="neumorphic" onClick={() => setShowRecover(false)}>Cancel</button>
            </form>
          </div>
        )}
        {showReset && (
          <div className="modal glassmorphic">
            <h3>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <label htmlFor="recoveryToken">Recovery Token</label>
              <input
                id="recoveryToken"
                type="text"
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                placeholder="Enter recovery token"
                required
              />
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button type="submit" className="neumorphic">Reset Password</button>
              <button type="button" className="neumorphic" onClick={() => setShowReset(false)}>Cancel</button>
            </form>
          </div>
        )}
      </main>
      <footer className="footer-modern">
        <p>© 2025 Intacom. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;