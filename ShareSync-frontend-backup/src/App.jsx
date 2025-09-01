// /src/App.jsx
import React, { useContext, Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./AuthContext";
import "./theme.css";
import "./styles/card.css";
import { ToastHost } from "./components/ui/toast";
import ErrorBoundary from "./ErrorBoundary";

// Sprint context + widget
import { SprintProvider } from "./context/SprintContext";
import MiniSprintWidget from "./components/global/MiniSprintWidget";

// Break (global short-break timer)
import { BreakProvider } from "./context/BreakContext";

// Notes + Pinned global layers
import { NotesProvider } from "./context/NotesContext";
import { PinnedProvider } from "./context/PinnedContext";
import QuickNotesDrawer from "./components/global/QuickNotesDrawer";
import PinnedTaskPanel from "./components/global/PinnedTaskPanel";

// Command Palette
import { CommandPaletteProvider } from "./hooks/useCommandPalette";
import CommandPalette from "./components/global/CommandPalette";

// 🔗 Hash scrolling
import { scrollToAnchorFromHash } from "./utils/anchor";

// ✅ NEW: global user context for avatar propagation & socket updates
import UserProvider, { UserContext } from "./context/UserContext";

const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicProject = lazy(() => import("./pages/PublicProject"));
// Public status page
const PublicProjectStatus = lazy(() => import("./pages/PublicProjectStatus"));

/** Smooth-scroll to #hash elements whenever path or hash changes */
function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    const ok = scrollToAnchorFromHash(location.hash);
    if (!ok && location.hash) {
      const t = setTimeout(() => scrollToAnchorFromHash(location.hash), 120);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.hash]);
  return null;
}

function GuardedRoutes() {
  const { user, ready } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Paths that never require auth (prefix checks)
  const openRoutes = ["/login", "/create-account", "/forgot-password", "/p/", "/status"];

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
      <ScrollToHash />
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

        {/* Public (open) */}
        <Route path="/p/:token" element={<PublicProject />} />
        <Route path="/status/:token" element={<PublicProjectStatus />} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}

const AppRoutes = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const { user: profileUser } = useContext(UserContext); // ✅ live-updating user (socket/cache-busted)
  const navbarUser = profileUser || authUser;

  return (
    <>
      <Navbar user={navbarUser} onLogout={logout} />
      <div id="main" role="main" className="main-content">
        <GuardedRoutes />
      </div>
      <ToastHost />
    </>
  );
};

const App = () => (
  <AuthProvider>
    {/* ✅ Wrap the app so avatars/names update everywhere in real-time */}
    <UserProvider>
      <ErrorBoundary>
        <Router>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 bg-white text-ink-900 px-3 py-2 rounded-lg shadow"
          >
            Skip to content
          </a>

          {/* Global Command Palette provider (handles ⌘K / Ctrl-K) */}
          <CommandPaletteProvider>
            {/* Providers for global, persistent UI layers */}
            <SprintProvider>
              <BreakProvider>
                <NotesProvider>
                  <PinnedProvider>
                    <div className="app-container" data-accent="indigo">
                      <AppRoutes />
                    </div>

                    {/* Global floating tools */}
                    <MiniSprintWidget />
                    <QuickNotesDrawer />
                    <PinnedTaskPanel />
                  </PinnedProvider>
                </NotesProvider>
              </BreakProvider>
            </SprintProvider>

            {/* Rendered once at root so it overlays everything */}
            <CommandPalette />
          </CommandPaletteProvider>
        </Router>
      </ErrorBoundary>
    </UserProvider>
  </AuthProvider>
);

export default App;