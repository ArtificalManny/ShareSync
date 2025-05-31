import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FolderPlus, AlertCircle } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated, isLoading, authError, setIntendedRoute } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      console.log('Home - Waiting for AuthContext to finish loading');
      return;
    }

    if (!isAuthenticated) {
      console.log('Home - User not authenticated, redirecting to login');
      setIntendedRoute('/');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, setIntendedRoute]);

  if (isLoading) {
    return <div className="home-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError) {
    return (
      <div className="home-container">
        <p className="text-red-500">{authError}</p>
        <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirect handled by useEffect
  }

  const totalProjects = user.projects?.length || 0;
  const currentProjects = user.projects?.filter(p => p.status !== 'Completed').length || 0;
  const pastProjects = user.projects?.filter(p => p.status === 'Completed').length || 0;
  const tasksCompleted = user.projects?.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0) || 0;

  return (
    <div className="home-container">
      <div className="home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter font-bold text-holo-blue mb-4 animate-text-glow">
          Welcome, {user.firstName} {user.lastName}!
        </h1>
        <p className="text-holo-gray mb-4">Collaborate and manage your projects with ShareSync.</p>
        <Link
          to="/projects"
          className="btn-primary rounded-full flex items-center mx-auto animate-glow z-20"
          aria-label="Go to Projects"
        >
          <FolderPlus className="w-5 h-5 mr-2" /> View Your Projects
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="metrics-dashboard grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="metric-card card p-6 glassmorphic holographic-effect">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Total Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{totalProjects}</p>
          </div>
          <div className="metric-card card p-6 glassmorphic holographic-effect">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Current Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{currentProjects}</p>
          </div>
          <div className="metric-card card p-6 glassmorphic holographic-effect">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Past Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{pastProjects}</p>
          </div>
          <div className="metric-card card p-6 glassmorphic holographic-effect">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Tasks Completed</h2>
            <p className="text-3xl font-bold text-holo-pink">{tasksCompleted}</p>
          </div>
        </div>

        {totalProjects === 0 && (
          <p className="text-holo-gray flex items-center gap-2 justify-center">
            <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> 
            You haven't created any projects yet. Start by creating one!
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;