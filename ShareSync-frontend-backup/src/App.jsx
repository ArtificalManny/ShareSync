// src/App.jsx
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

// Global styles
import "./theme.css";
import "./styles/card.css";
import "./styles/tokens.css";
import "./styles/gradients.css";
import "./styles/motion.css";
import "./components/Sidebar.css";
import "./styles/messenger.css";
import "./styles/search.css";
import "./styles/type.css";
import "./styles/spacing.css";
import "./styles/chips.css";
import "./styles/command-palette.css";
import "./styles/toast.css"; // ⬅️ add Proton toast styles

// Neon rings, focus & shared UI styles
//* import "./styles/rings.css";
//import "./styles/focus.css";
//import "./components/ui/buttons.css";
//import "./components/ui/skeleton.css";

import ToastProvider, { ToastHost } from "./components/ui/toast";
import ErrorBoundary from "./ErrorBoundary";

import { SprintProvider } from "./context/SprintContext";
import MiniSprintWidget from "./components/global/MiniSprintWidget";
import { BreakProvider } from "./context/BreakContext";
import { NotesProvider } from "./context/NotesContext";
import { PinnedProvider } from "./context/PinnedContext";
import QuickNotesDrawer from "./components/global/QuickNotesDrawer";
import PinnedDrawer from "./components/global/PinnedDrawer.jsx";
import LayoutSkin from "./components/LayoutSkin.jsx";

import { CommandPaletteProvider } from "./hooks/useCommandPalette";
import CommandPalette from "./components/global/CommandPalette";
import { scrollToAnchorFromHash } from "./utils/anchor";

import UserProvider, { UserContext } from "./context/UserContext";
import Sidebar from "./components/Sidebar";

import MessengerPanel from "./components/messenger/MessengerPanel.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";

// Focus (gated)
import { FocusProvider } from "./context/FocusContext.jsx";
import FocusDock from "./components/focus/FocusDock.jsx";
import FocusToasts from "./components/toast/FocusToasts.jsx";

// Public routes chunk (returns <Route/> children only)
import PublicRoutes from "./routes/publicRoutes.jsx";

// Flags
import {
  MESSENGER_V1,
  BRAND_V2,
  DISCOVERY_V1,
  IMPORT_WIZARD_V1,
  ADMIN_CONSOLE_V1,
  PULSE_ADMIN_V1,
  PUBLIC_PAGES_V1,
  FOCUS_DOCK_V1,
} from "./config/flags.js";

import FeatureGate from "./utils/FeatureGate.jsx";
import useBrandTheme from "./hooks/useBrandTheme.js";

// Lazy pages
const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const DMPage = lazy(() => import("./pages/DMPage.jsx"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicProjectStatus = lazy(() => import("./pages/PublicProjectStatus"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AcceptInvite = lazy(() => import("./components/AcceptInvite.jsx"));
const Discover = lazy(() => import("./pages/Discover.jsx"));
const ImportWizard = lazy(() => import("./pages/import/ImportWizard.jsx"));
const AdminConsole = lazy(() => import("./pages/admin/AdminConsole.jsx"));
const PulseAdmin = lazy(() => import("./pages/admin/PulseAdmin.jsx"));

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

  // Paths allowed while logged out
  const openRoutes = [
    "/login",
    "/create-account",
    "/forgot-password",
    "/p/",     // public project
    "/u/",     // public profile
    "/status", // legacy public status
    "/invite",
  ];

  useEffect(() => {
    if (!ready) return;
    const isOpen = openRoutes.some((p) => location.pathname.startsWith(p));
    if (!isOpen && !user) navigate("/login", { replace: true });
  }, [user, ready, location.pathname, navigate]);

  return (
    <Suspense fallback={<div className="px-6 py-10 text-center text-slate-500">Loading page…</div>}>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectHome />} />
        <Route path="/settings" element={<Settings />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Profile (authenticated) */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/me" element={<Profile />} />

        {/* Public (insert only <Route/>s) */}
        {PUBLIC_PAGES_V1 && <PublicRoutes />}

        {/* Legacy public status */}
        <Route path="/status/:token" element={<PublicProjectStatus />} />

        {/* Messenger full-page */}
        <Route path="/messages" element={<DMPage />} />
        <Route path="/messages/:id" element={<DMPage />} />

        {/* Invite accept */}
        <Route path="/invite/accept" element={<AcceptInvite />} />

        {/* Search */}
        <Route path="/search" element={<SearchPage />} />

        {/* Discover (gated) */}
        <Route
          path="/discover"
          element={DISCOVERY_V1 ? <Discover /> : <Navigate to="/home" replace />}
        />

        {/* Import Wizard (gated) */}
        <Route
          path="/import"
          element={
            <FeatureGate flag={IMPORT_WIZARD_V1} fallback={<Navigate to="/home" replace />}>
              <ImportWizard />
            </FeatureGate>
          }
        />

        {/* Admin Console (gated) */}
        <Route
          path="/admin/console"
          element={
            <FeatureGate flag={ADMIN_CONSOLE_V1} fallback={<Navigate to="/home" replace />}>
              <AdminConsole />
            </FeatureGate>
          }
        />

        {/* Pulse Admin (gated) */}
        <Route
          path="/admin/pulse"
          element={
            <FeatureGate flag={PULSE_ADMIN_V1} fallback={<Navigate to="/home" replace />}>
              <PulseAdmin />
            </FeatureGate>
          }
        />

        {/* Fallback */}
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

      <ChatProvider userId={navbarUser?._id || navbarUser?.id}>
        <div id="main" role="main" className="main-content with-sidebar">
          <GuardedRoutes />
        </div>
        {MESSENGER_V1 && <MessengerPanel />}
      </ChatProvider>

      <ToastHost />
    </>
  );
};

const App = () => {
  const { containerAttrs } = useBrandTheme({
    enabled: BRAND_V2,
    applyToDocument: true,
    defaultBrand: "v2",
    defaultAccent: "pandora",
  });

  // Tiny shell so we can conditionally wrap FocusProvider
  const Shell = (
    <>
      <div className="app-container" {...containerAttrs}>
        <AppRoutes />
      </div>

      {/* Globals */}
      <MiniSprintWidget />
      <QuickNotesDrawer />
      <PinnedDrawer />
      {FOCUS_DOCK_V1 && <FocusDock />}
      {FOCUS_DOCK_V1 && <FocusToasts />}
    </>
  );

  return (
    <AuthProvider>
      <UserProvider>
        <ErrorBoundary>
          <ToastProvider>
            <Router>
              {/* Accessibility helper */}
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 bg-white text-ink-900 px-3 py-2 rounded-lg shadow"
              >
                Skip to content
              </a>

              {/* Route-aware accent & brand wrapper (must be inside Router) */}
              <LayoutSkin>
                <CommandPaletteProvider>
                  {FOCUS_DOCK_V1 ? <FocusProvider>{Shell}</FocusProvider> : Shell}
                  <CommandPalette />
                </CommandPaletteProvider>
              </LayoutSkin>
            </Router>
          </ToastProvider>
        </ErrorBoundary>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;