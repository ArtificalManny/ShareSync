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
import "./styles/tokens.css";
import "./styles/gradients.css";
import "./styles/motion.css";
import "./components/Sidebar.css";
import "./styles/messenger.css";
import "./styles/search.css";

import { ToastHost } from "./components/ui/toast";
import ErrorBoundary from "./ErrorBoundary";

import { SprintProvider } from "./context/SprintContext";
import MiniSprintWidget from "./components/global/MiniSprintWidget";
import { BreakProvider } from "./context/BreakContext";
import { NotesProvider } from "./context/NotesContext";
import { PinnedProvider } from "./context/PinnedContext";
import QuickNotesDrawer from "./components/global/QuickNotesDrawer";
import PinnedDrawer from "./components/global/PinnedDrawer.jsx";

import { CommandPaletteProvider } from "./hooks/useCommandPalette";
import CommandPalette from "./components/global/CommandPalette";
import { scrollToAnchorFromHash } from "./utils/anchor";

import UserProvider, { UserContext } from "./context/UserContext";
import Sidebar from "./components/Sidebar";

import MessengerPanel from "./components/messenger/MessengerPanel.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import { MESSENGER_V1, BRAND_V2 } from "./config/flags.js";
import { DISCOVERY_V1 } from "./config/flags.js"; // ⬅️ feature flag

import useBrandTheme from "./hooks/useBrandTheme.js";

const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const DMPage = lazy(() => import("./pages/DMPage.jsx"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicProject = lazy(() => import("./pages/PublicProject"));
const PublicProjectStatus = lazy(() => import("./pages/PublicProjectStatus"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AcceptInvite = lazy(() => import("./components/AcceptInvite.jsx"));
const Discover = lazy(() => import("./pages/Discover.jsx")); // ⬅️ page

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

  const openRoutes = ["/login", "/create-account", "/forgot-password", "/p/", "/status", "/invite"];

  useEffect(() => {
    if (!ready) return;
    const isOpen = openRoutes.some((p) => location.pathname.startsWith(p));
    if (!isOpen && !user) navigate("/login", { replace: true });
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

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/me" element={<Profile />} />

        {/* Public */}
        <Route path="/p/:token" element={<PublicProject />} />
        <Route path="/status/:token" element={<PublicProjectStatus />} />

        {/* Messenger full-page */}
        <Route path="/messages" element={<DMPage />} />
        <Route path="/messages/:id" element={<DMPage />} />

        {/* Invite accept */}
        <Route path="/invite/accept" element={<AcceptInvite />} />

        {/* Search */}
        <Route path="/search" element={<SearchPage />} />

        {/* Discovery (gated) */}
        <Route
          path="/discover"
          element={DISCOVERY_V1 ? <Discover /> : <Navigate to="/home" replace />}
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}

const AppRoutes = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const { user: profileUser } = useContext(UserContext);
  const navbarUser = profileUser || authUser;

  return (
    <>
      <Sidebar />
      <Navbar user={navbarUser} onLogout={logout} />

      {/* ChatProvider wraps both routed pages AND the floating messenger panel */}
      <ChatProvider userId={navbarUser?._id || navbarUser?.id}>
        <div id="main" role="main" className="main-content with-sidebar">
          <GuardedRoutes />
        </div>

        <MessengerPanel />
      </ChatProvider>

      <ToastHost />
    </>
  );
};

const App = () => {
  const { containerAttrs } = useBrandTheme({ enabled: BRAND_V2 });

  return (
    <AuthProvider>
      <UserProvider>
        <ErrorBoundary>
          <Router>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 bg-white text-ink-900 px-3 py-2 rounded-lg shadow"
            >
              Skip to content
            </a>

            <CommandPaletteProvider>
              <SprintProvider>
                <BreakProvider>
                  <NotesProvider>
                    <PinnedProvider>
                      <div
                        className="app-container layout-stage" 
                        data-accent="indigo"
                        {...containerAttrs}
                      >
                        <AppRoutes />
                      </div>

                      <MiniSprintWidget />
                      <QuickNotesDrawer />
                      <PinnedDrawer />
                    </PinnedProvider>
                  </NotesProvider>
                </BreakProvider>
              </SprintProvider>

              <CommandPalette />
            </CommandPaletteProvider>
          </Router>
        </ErrorBoundary>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;
