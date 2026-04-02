import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyDashboard, getMyProfileStats } from '../api/analytics';
import { useAuth } from '../context/AuthContext';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const { user } = useAuth();
  
  // State for the two main data pillars
  const [dashboardStats, setDashboardStats] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllStats = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both endpoints concurrently for maximum performance
      const [dashboardData, profileData] = await Promise.all([
        getMyDashboard(),
        getMyProfileStats()
      ]);
      
      setDashboardStats(dashboardData);
      setProfileStats(profileData);
    } catch (err) {
      console.error("[AnalyticsContext] Failed to fetch analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch stats when a user logs in
  useEffect(() => {
    if (user) {
      fetchAllStats();
    }
  }, [user]);

  const value = {
    dashboardStats,
    profileStats,
    loading,
    error,
    refreshStats: fetchAllStats // Exposed in case a component needs to manually refresh
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to be used in Home.jsx, Profile.jsx, Discover.jsx
export const useAnalytics = () => useContext(AnalyticsContext);
