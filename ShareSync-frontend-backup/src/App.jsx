// /src/App.jsx
import React, {
  useState,
  useReducer,
  useEffect,
  useContext,
  Suspense,
  lazy,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate, // ⬅ for redirects
} from "react-router-dom";

import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./AuthContext";
import "./theme.css";
import "./styles/card.css";
import { ToastHost } from "./components/ui/toast";

// Lazy-load route components (code splitting)
const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));        // used for /me and /u/:username
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicStreakFeed = lazy(() => import("./components/feed/PublicStreakFeed.jsx"));

const searchReducer = (state, action) => {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "SET_SUGGESTIONS":
      return { ...state, suggestions: action.payload };
    default:
      return state;
  }
};

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    query: "",
    suggestions: [],
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("purple");
  const [feedItems, setFeedItems] = useState([]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen((prev) => !prev);
    if (isNotificationDropdownOpen) setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen((prev) => !prev);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const changeAccentColor = (color) => setAccentColor(color);

  // Demo feed tick (safe to remove in prod)
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedItems((prev) => [
        ...prev,
        {
          projectId: "1",
          projectTitle: "Project Alpha",
          type: "activity",
          message: `New update at ${new Date().toLocaleTimeString()}`,
          user: "user@example.com",
          profilePicture: "https://via.placeholder.com/40",
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
          shares: 0,
        },
      ]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      {/* ✅ Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 bg-white text-ink-900 px-3 py-2 rounded-lg shadow"
      >
        Skip to content
      </a>

      <div className="app-container" data-accent="indigo">
        <Navbar
          user={user}
          logout={logout}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* ✅ Identify the main region for the skip link */}
        <div id="main" role="main" className="main-content">
          <Suspense
            fallback={
              <div
                className="px-6 py-10 text-center text-slate-500"
                role="status"
                aria-live="polite"
              >
                Loading page…
              </div>
            }
          >
            <Routes>
              {/* Redirect root to /home */}
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Core pages */}
              <Route path="/home" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectHome />} />
              <Route path="/settings" element={<Settings />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/create-account" element={<CreateAccount />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Profile routes */}
              {/* Back-compat route you already had */}
              <Route path="/profile/:username" element={<Profile />} />
              {/* NEW: public profile */}
              <Route path="/u/:username" element={<Profile />} />
              {/* NEW: owner profile */}
              <Route path="/me" element={<Profile />} />

              {/* Public cadence feed */}
              <Route
                path="/streak"
                element={
                  <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-gray-900 min-h-screen max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                      Public Cadence Feed
                    </h1>
                    <PublicStreakFeed
                      initialType="all"
                      initialSince="7d"
                      initialSort="newest"
                      pageSize={20}
                    />
                  </div>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </div>

        {/* Mount toasts once */}
        <ToastHost />
      </div>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;