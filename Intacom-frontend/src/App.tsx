import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Project from './pages/Project';
import ProjectEdit from './pages/ProjectEdit';
import ProjectCreate from './pages/ProjectCreate';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';

function App() {
  return (
    <>
      <GlobalStyles />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile/:username/edit" element={<ProfileEdit />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/project/:id/edit" element={<ProjectEdit />} />
          <Route path="/project/create" element={<ProjectCreate />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;