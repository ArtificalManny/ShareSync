// src/App.jsx - UPDATED WITH PROPER LAYOUT
import React, { useContext, Suspense, lazy, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

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
import "./styles/toast.css";
import "./styles/glass.css";
import "./styles/focus.css";
import "./styles/cursor-effects.css";
import "./styles/layout-system.css"; // ⭐ NEW: Proper layout system

import ToastProviderOld, { ToastHost } from "./components/ui/toast";
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

import UserProvider, { UserContext } from "./context/UserContext";
import Sidebar from "./components/Sidebar";

import MessengerPanel from "./components/messenger/MessengerPanel.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";

import { FocusProvider } from "./context/FocusContext.jsx";
import FocusDock from "./components/focus/FocusDock.jsx";
import FocusToasts from "./components/toast/FocusToasts.jsx";

import MentorDock from "./components/mentor/MentorDock.jsx";
import LeaderboardDock from "./components/momentum/LeaderboardDock.jsx";

import PublicRoutes from "./routes/publicRoutes.jsx";

// ⭐ CURSOR SYSTEM IMPORTS
import { CursorProvider } from "./context/CursorContext";
import CursorLayer from "./components/realtime/CursorLayer";
import ShipFlash from "./components/effects/ShipFlash";
import SyncPulse from "./components/effects/SyncPulse";
import CursorRecorder from "./components/recording/CursorRecorder";
import GhostMode from "./components/modes/GhostMode";
import DeepWorkMode from "./components/modes/DeepWorkMode";
import TouchCursor from "./components/realtime/TouchCursor";

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

import { scrollToAnchorFromHash } from "./utils/anchor";
import { Menu, X } from "lucide-react";

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
const Analytics = lazy(() => import("./pages/Analytics.jsx"));

function ScrollToHash() {
  const location = useLocation();
  React.useEffect(() => {
    const ok = scrollToAnchorFromHash(location.hash);
    if (!ok && location.hash) {
      const t = setTimeout(() => scrollToAnchorFromHash(location.hash), 120);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.hash]);
  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

// ⭐ NEW: Sidebar Toggle Component
function SidebarToggle({ sidebarOpen, setSidebarOpen }) {
  return (
    <button
      className="sidebar-toggle"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      aria-label="Toggle Sidebar"
    >
      {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}

// ⭐ NEW: Sidebar Overlay (mobile)
function SidebarOverlay({ show, onClick }) {
  return <div className={`sidebar-overlay ${show ? 'active' : ''}`} onClick={onClick} />;
}

function AppRoutes() {
  const { user: authUser, logout } = useAuth();
  const { user: profileUser } = useContext(UserContext);
  const navbarUser = profileUser || authUser;
  
  // ⭐ NEW: Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* ⭐ Sidebar Toggle (mobile only) */}
      <SidebarToggle sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* ⭐ Mobile Overlay */}
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      
      {/* ⭐ Sidebar with proper class */}
      <div className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar />
      </div>
      
      {/* ⭐ Navbar with proper positioning */}
      <div className="navbar">
        <Navbar user={navbarUser} onLogout={logout} />
      </div>

      <ChatProvider userId={navbarUser?._id || navbarUser?.id}>
        {/* ⭐ Main Content with proper margin */}
        <div className="main-content">
          <div className="content-wrapper">
            <Suspense fallback={<div className="px-6 py-10 text-center text-slate-500">Loading page…</div>}>
              <ScrollToHash />
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectHome /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/create-account" element={<PublicOnlyRoute><CreateAccount /></PublicOnlyRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {PUBLIC_PAGES_V1 && <Route path="/p/*" element={<PublicRoutes />} />}
                <Route path="/status/:token" element={<PublicProjectStatus />} />

                <Route path="/messages" element={<ProtectedRoute><DMPage /></ProtectedRoute>} />
                <Route path="/messages/:id" element={<ProtectedRoute><DMPage /></ProtectedRoute>} />

                <Route path="/invite/accept" element={<AcceptInvite />} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

                {/* ⭐ Analytics Routes */}
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/projects/:projectId/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

                <Route
                  path="/discover"
                  element={
                    DISCOVERY_V1 ? (
                      <ProtectedRoute><Discover /></ProtectedRoute>
                    ) : (
                      <Navigate to="/home" replace />
                    )
                  }
                />

                <Route
                  path="/import"
                  element={
                    <FeatureGate flag={IMPORT_WIZARD_V1} fallback={<Navigate to="/home" replace />}>
                      <ProtectedRoute><ImportWizard /></ProtectedRoute>
                    </FeatureGate>
                  }
                />

                <Route
                  path="/admin/console"
                  element={
                    <FeatureGate flag={ADMIN_CONSOLE_V1} fallback={<Navigate to="/home" replace />}>
                      <ProtectedRoute><AdminConsole /></ProtectedRoute>
                    </FeatureGate>
                  }
                />

                <Route
                  path="/admin/pulse"
                  element={
                    <FeatureGate flag={PULSE_ADMIN_V1} fallback={<Navigate to="/home" replace />}>
                      <ProtectedRoute><PulseAdmin /></ProtectedRoute>
                    </FeatureGate>
                  }
                />

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        
        {MESSENGER_V1 && <MessengerPanel />}
      </ChatProvider>

      <ToastHost />
      
      {/* ⭐ CURSOR MODES - Properly positioned */}
      <div className="cursor-modes">
        <GhostMode />
        <DeepWorkMode />
      </div>
      
      {/* ⭐ CURSOR OVERLAY */}
      <CursorLayer />
      
      {/* ⭐ CURSOR EFFECTS */}
      <ShipFlash />
      <SyncPulse />
      
      {/* ⭐ CURSOR RECORDER */}
      <CursorRecorder enabled={true} />
      
      {/* ⭐ MOBILE SUPPORT */}
      <TouchCursor />
    </>
  );
}

const App = () => {
  const { containerAttrs } = useBrandTheme({
    enabled: BRAND_V2,
    applyToDocument: true,
    defaultBrand: "v2",
    defaultAccent: "pandora",
  });

  const Shell = (
    <>
      <div className="app-container" {...containerAttrs}>
        <AppRoutes />
      </div>

      <MiniSprintWidget />
      <QuickNotesDrawer />
      <PinnedDrawer />
      {FOCUS_DOCK_V1 && <FocusDock />}
      {FOCUS_DOCK_V1 && <FocusToasts />}
      <MentorDock />
      <LeaderboardDock />
    </>
  );

  return (
    <AuthProvider>
      <UserProvider>
        <CursorProvider>
          <SprintProvider>
            <ErrorBoundary>
              <ToastProvider>
                <Router>
                  <LayoutSkin>
                    <CommandPaletteProvider>
                      {FOCUS_DOCK_V1 ? (
                        <FocusProvider>{Shell}</FocusProvider>
                      ) : (
                        Shell
                      )}
                    </CommandPaletteProvider>
                  </LayoutSkin>
                </Router>
              </ToastProvider>
            </ErrorBoundary>
          </SprintProvider>
        </CursorProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;