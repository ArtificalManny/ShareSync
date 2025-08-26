// /src/App.jsx
import React, { useContext, Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./AuthContext";
import "./theme.css";
import "./styles/card.css";
import { ToastHost } from "./components/ui/toast";

const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicProject = lazy(() => import("./pages/PublicProject"));

function GuardedRoutes() {
  const { user, ready } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Paths that never require auth
  const openRoutes = ["/login", "/create-account", "/forgot-password"];

  useEffect(() => {
    if (!ready) return;
    const isOpen = openRoutes.some((p) => location.pathname.startsWith(p));
    if (!isOpen && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, ready, location.pathname, navigate]);

  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-center text-slate-500" role="status" aria-live="polite">
          Loading page…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectHome />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Profile routes */}
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/me" element={<Profile />} />

        {/* Public feed (open) */}
        <Route path="/p/:token" element={<PublicProject />} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <div id="main" role="main" className="main-content">
        <GuardedRoutes />
      </div>
      <ToastHost />
    </>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 bg-white text-ink-900 px-3 py-2 rounded-lg shadow"
      >
        Skip to content
      </a>
      <div className="app-container" data-accent="indigo">
        <AppRoutes />
      </div>
    </Router>
  </AuthProvider>
);

export default App;
