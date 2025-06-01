import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, Users } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, authError } = useContext(AuthContext);

  useEffect(() => {
    if (isLoading) {
      console.log('Home - Waiting for AuthContext to finish loading');
      return;
    }

    if (!isAuthenticated) {
      console.log('Home - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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

  if (!user) {
    return <div className="home-container"><p className="text-holo-gray">Please log in to continue.</p></div>;
  }

  const totalProjects = user.projects?.length || 0;
  const currentProjects = user.projects?.filter(p => p.status !== 'Completed').length || 0;
  const pastProjects = user.projects?.filter(p => p.status === 'Completed').length || 0;
  const tasksCompleted = user.projects?.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0) || 0;
  const recentActivity = user.projects?.flatMap(p => p.activityLog || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5) || [];

  return (
    <div className="home-container">
      <div className="home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
          Welcome, {user.firstName}!
        </h1>
        <p className="text-holo-gray mb-4">Your hub for collaboration and productivity.</p>
        <Link
          to="/projects"
          className="btn-primary rounded-full inline-flex items-center px-4 py-2 animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
          aria-label="Go to Projects"
        >
          <Folder className="w-5 h-5 mr-2" /> View Your Projects
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="dashboard grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="dashboard-card card p-6 glassmorphic hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Total Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{totalProjects}</p>
          </div>
          <div className="dashboard-card card p-6 glassmorphic hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Current Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{currentProjects}</p>
          </div>
          <div className="dashboard-card card p-6 glassmorphic hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Past Projects</h2>
            <p className="text-3xl font-bold text-holo-pink">{pastProjects}</p>
          </div>
          <div className="dashboard-card card p-6 glassmorphic hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-inter text-holo-blue mb-2">Tasks Completed</h2>
            <p className="text-3xl font-bold text-holo-pink">{tasksCompleted}</p>
          </div>
        </div>

        <div className="recent-activity-section card p-6 glassmorphic mb-8">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-holo-gray flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No recent activity.
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item p-3 rounded bg-holo-bg-light">
                  <p className="text-holo-gray">{activity.message}</p>
                  <p className="text-holo-gray text-sm">By: {activity.user}</p>
                  <p className="text-holo-gray text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-links card p-6 glassmorphic">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/projects"
              className="quick-link card p-4 glassmorphic hover:shadow-lg transition-shadow text-center"
              aria-label="Create a New Project"
            >
              <Folder className="w-6 h-6 mx-auto mb-2 text-holo-blue" />
              <p className="text-holo-gray">Create a New Project</p>
            </Link>
            <Link
              to={`/profile/${user.username}`}
              className="quick-link card p-4 glassmorphic hover:shadow-lg transition-shadow text-center"
              aria-label="View Your Profile"
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-holo-blue" />
              <p className="text-holo-gray">View Your Profile</p>
            </Link>
            <Link
              to="/projects"
              className="quick-link card p-4 glassmorphic hover:shadow-lg transition-shadow text-center"
              aria-label="Collaborate with Team"
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-holo-blue" />
              <p className="text-holo-gray">Collaborate with Team</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;