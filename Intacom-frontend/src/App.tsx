import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUserCircle, faPlusCircle, faHome, faFolder, faUpload, faCog, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import AppRoutes from './Routes';

// Define User type
interface User {
  _id?: string;
  firstName?: string;
  username: string;
  email?: string;
  profilePic?: string;
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

  // Fetch projects and notifications when user logs in
  useEffect(() => {
    console.log('User state:', user);
    if (user) {
      console.log('User is set, navigating to /home');
      navigate('/home');
      const fetchProjects = async () => {
        try {
          console.log('Fetching projects for user:', user.username);
          const response = await axios.get<ProjectsResponse>(`http://localhost:3000/projects/${user.username}`);
          console.log('Projects response:', response.data);
          const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
          console.log('Setting projects to:', projectsData);
          setProjects(projectsData);
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          setProjects([]);
        }
      };
      const fetchNotifications = async () => {
        try {
          console.log('Fetching notifications for user:', user._id);
          const response = await axios.get<NotificationsResponse>(`http://localhost:3000/notifications/${user._id}`);
          console.log('Notifications response:', response.data);
          setNotifications(response.data.data || []);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
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
        setProfilePic(profilePicUrl);

        // Update user profile with new picture
        const updatedUser = { ...user, profilePic: profilePicUrl };
        await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
        setUser(updatedUser);
      } catch (error: any) {
        console.error('Profile picture upload error:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'An error occurred during profile picture upload');
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
      console.log('Submitting payload to', url, ':', payload);
      if (isLogin) {
        const response = await axios.post<LoginResponse>(`http://localhost:3000${url}`, payload);
        console.log('Login response:', response.data);
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
        console.log('User set to:', userData);
        console.log('Navigating to /home');
        navigate('/home');
      } else {
        const response = await axios.post<RegisterResponse>(`http://localhost:3000${url}`, payload);
        console.log('Register response:', response.data);
        if (response.data && response.data.user) {
          setUser(response.data.user);
          console.log('User set to:', response.data.user);
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
    console.log('Logging out user');
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
      console.log('Sending recovery request for email:', recoveryEmail);
      const response = await axios.get<RecoverResponse>(`http://localhost:3000/auth/recover`, { params: { email: recoveryEmail } });
      console.log('Recovery response:', response.data);
      alert(response.data.message + ' (Token: ' + response.data.token + '). Enter the token below.');
      setShowRecover(false);
      setShowReset(true);
    } catch (error: any) {
      console.error('Recover password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during password recovery');
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      console.log('Sending reset request with token:', recoveryToken, 'and new password:', newPassword);
      const response = await axios.put<ResetResponse>(`http://localhost:3000/auth/reset`, { token: recoveryToken, newPassword });
      console.log('Reset response:', response.data);
      alert(response.data.message);
      setShowReset(false);
      setRecoveryEmail('');
      setRecoveryToken('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during password reset');
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
      console.log('Creating project with data:', {
        name: projectName,
        description: projectDescription,
        admin: user?.username,
        color: projectColor,
        sharedWith: sharedUsers.map((u) => ({ userId: u.email, role: u.role })),
      });
      const response = await axios.post<ProjectResponse>(`http://localhost:3000/projects`, {
        name: projectName,
        description: projectDescription,
        admin: user?.username,
        color: projectColor,
        sharedWith: sharedUsers.map((u) => ({ userId: u.email, role: u.role })),
      });
      console.log('Create project response:', response.data);
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

  try {
    return (
      <>
        <header>
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
                  <div className="notification-dropdown">
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
                <Link to="/profile" onClick={() => console.log('Navigating to /profile')}>
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
          <aside>
            <div className="profile-section">
              <Link to="/profile" onClick={() => console.log('Navigating to /profile from sidebar')}>
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
                <Link to="/home" onClick={() => console.log('Navigating to /home')}>
                  Home
                </Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faFolder} className="menu-icon" />
                <Link to="/projects" onClick={() => console.log('Navigating to /projects')}>
                  Projects
                </Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faUpload} className="menu-icon" />
                <Link to="/upload" onClick={() => console.log('Navigating to /upload')}>
                  Upload
                </Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faCog} className="menu-icon" />
                <Link to="/settings" onClick={() => console.log('Navigating to /settings')}>
                  Settings
                </Link>
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
                style={{
                  background: project.color || '#3a3a50',
                  padding: '0.5rem',
                  margin: '0.5rem 0',
                  borderRadius: '5px',
                }}
              >
                <Link to={`/project/${project._id}`} onClick={() => console.log(`Navigating to /project/${project._id}`)}>
                  {project.name}
                </Link>
              </div>
            ))}
          </aside>
        )}
        <main className={user ? '' : 'full-screen'}>
          {console.log('Rendering main, user:', user)}
          {!user ? (
            <form onSubmit={handleSubmit} style={{ maxWidth: '500px', width: '100%' }}>
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
                  <button type="submit">Login</button>
                  <button type="button" onClick={() => setShowRecover(true)}>
                    Forgot Password?
                  </button>
                  <button type="button" onClick={() => setIsLogin(!isLogin)}>
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
                  <button type="submit">Register</button>
                  <button type="button" onClick={() => setShowRecover(true)}>
                    Forgot Password?
                  </button>
                  <button type="button" onClick={() => setIsLogin(!isLogin)}>
                    Switch to Login
                  </button>
                </>
              )}
            </form>
          ) : (
            <AppRoutes
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
          )}
          {showRecover && (
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2a2a3e', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: 1000 }}>
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
                <button type="submit">Recover Password</button>
                <button type="button" onClick={() => setShowRecover(false)}>Cancel</button>
              </form>
            </div>
          )}
          {showReset && (
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2a2a3e', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: 1000 }}>
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
                <button type="submit">Reset Password</button>
                <button type="button" onClick={() => setShowReset(false)}>Cancel</button>
              </form>
            </div>
          )}
        </main>
        <footer>
          <p style={{ color: '#b0b0ff' }}>© 2025 Intacom. All rights reserved.</p>
        </footer>
      </>
    );
  } catch (error) {
    console.error('Error rendering App component:', error);
    return <div>Error rendering the application. Please check the console for details.</div>;
  }
};

export default App;