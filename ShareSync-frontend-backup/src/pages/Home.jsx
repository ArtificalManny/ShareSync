import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, LogIn, BarChart, Activity, Info } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [dashboardStats, setDashboardStats] = useState({ projects: 0, tasksCompleted: 0, recentActivity: [] });
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      const stats = {
        projects: user.projects?.length || 0,
        tasksCompleted: user.projects?.reduce((sum, proj) => sum + (proj.tasksCompleted || 0), 0) || 0,
        recentActivity: user.projects?.flatMap(proj => proj.activityLog || []).slice(0, 3) || [],
      };
      setDashboardStats(stats);

      // Check if user is new (mock logic: first visit if no projects)
      const isNewUser = !localStorage.getItem('hasSeenTour') && stats.projects === 0;
      if (isNewUser) {
        setShowTour(true);
        localStorage.setItem('hasSeenTour', 'true');
      }
    }
  }, [user, isAuthenticated]);

  const tourSteps = [
    {
      title: "Welcome to ShareSync!",
      description: "This is your hub for managing projects with a futuristic twist. Let's take a quick tour!",
      position: "center",
    },
    {
      title: "Create a Project",
      description: "Click the 'Create New Project' button to start collaborating with your team.",
      position: "top-right",
    },
    {
      title: "Explore Features",
      description: "Navigate to your projects to experience VR mode, voice commands, and more!",
      position: "center",
    },
  ];

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      setTourStep(0);
    }
  };

  const skipTour = () => {
    setShowTour(false);
    setTourStep(0);
  };

  if (isLoading) {
    console.log('Home - Rendering loading state');
    return <div className="home-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError) {
    console.log('Home - Rendering auth error state:', authError);
    return (
      <div className="home-container">
        <p className="text-red-500">{authError}</p>
        <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">Welcome to ShareSync</h1>
        <p className="text-holo-gray mb-4">
          {isAuthenticated
            ? `Hello, ${user?.firstName || 'User'}! Manage your projects with ease.`
            : 'Collaborate, manage, and succeed with ShareSync.'}
        </p>
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/projects" className="btn-primary rounded-full flex items-center animate-glow">
              <Folder className="w-5 h-5 mr-2" /> View Projects
            </Link>
          ) : (
            <Link to="/login" className="btn-primary rounded-full flex items-center animate-glow">
              <LogIn className="w-5 h-5 mr-2" /> Get Started
            </Link>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="dashboard card p-6 glassmorphic holographic-effect">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Your Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stat-card card p-4 glassmorphic">
                <p className="text-holo-gray text-sm">Total Projects</p>
                <p className="text-2xl font-inter text-holo-blue animate-text-glow">{dashboardStats.projects}</p>
              </div>
              <div className="stat-card card p-4 glassmorphic">
                <p className="text-holo-gray text-sm">Tasks Completed</p>
                <p className="text-2xl font-inter text-holo-blue animate-text-glow">{dashboardStats.tasksCompleted}</p>
              </div>
            </div>
            <div className="recent-activity mt-6">
              <h3 className="text-lg font-inter text-holo-blue mb-2 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Recent Activity
              </h3>
              {dashboardStats.recentActivity.length === 0 ? (
                <p className="text-holo-gray">No recent activity.</p>
              ) : (
                <ul className="space-y-2">
                  {dashboardStats.recentActivity.map((activity, index) => (
                    <li key={index} className="text-primary">{activity.message} - {new Date(activity.timestamp).toLocaleString()}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showTour && (
        <div className={`tour-overlay ${tourSteps[tourStep].position}`}>
          <div className="tour-card card p-6 glassmorphic holographic-effect">
            <h3 className="text-xl font-inter text-holo-blue mb-2 animate-text-glow">{tourSteps[tourStep].title}</h3>
            <p className="text-holo-gray mb-4">{tourSteps[tourStep].description}</p>
            <div className="flex gap-4">
              <button onClick={nextTourStep} className="btn-primary rounded-full">
                {tourStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
              </button>
              <button onClick={skipTour} className="btn-primary rounded-full bg-holo-bg-light">Skip Tour</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;