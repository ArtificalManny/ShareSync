// src/App.jsx - PERFORMANCE OPTIMIZED + TOAST SYSTEM ENABLED + NOTIFICATION SETTINGS + PWA + COMMUNITY + PUBLIC PROFILES + HALL OF FAME + PROJECT SETTINGS + CONTEXT TRACKING + WELCOME BACK + CONTEXT INDICATOR + FLOW STATE + SOUND SYSTEM + PHASE N: COMMAND & CONTROL + ALIVE AWARE
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE A: Emotional Immediacy + Momentum Heartbeat
// PHASE F: The Sound of Progress
// PHASE N: Command & Control System
// PHASE 2A: WebSocket Socket Provider ⭐ NEW
// ALIVE AWARE: Adaptive Density + Fatigue Detection + Context Memory
// PHASE 8.1: Global Route Preloading Architecture
// PHASE 8.2: Responsive Design - MobileTabBar Injection
// ⭐ PHASE 9.2: Pitch Mode Implementation (Stealth Toggle)
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useContext, Suspense, lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider as OldToastProvider } from "./context/ToastContext";
import ToastProvider, { ToastHost } from "./components/ui/toast.jsx";
import { ToastProvider as NewToastProvider } from "./components/common/Toast";
import ErrorBoundary from "./ErrorBoundary";

import { SocketProvider } from "./context/SocketContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { useContextTracking } from "./hooks/useContextTracking";
import { FlowStateProvider } from "./contexts/FlowStateContext";
import { ContextPreservationProvider } from "./contexts/ContextPreservationContext";
import { MomentumProvider } from "./contexts/MomentumContext";
import { FocusSessionProvider } from "./contexts/FocusSessionContext";
import AppEntrance from "./components/onboarding/AppEntrance";
import useMomentumHeartbeat from "./hooks/useMomentumHeartbeat";
import { SoundProvider } from "./contexts/SoundContext";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcuts";
import InstallPrompt from "./components/pwa/InstallPrompt";
import AhaMomentToast from "./components/home/AhaMomentToast";
import PrivacyManifesto from "./pages/PrivacyManifesto";
import { FocusEngineProvider } from "./contexts/FocusEngineContext";
import { AdaptiveDensityProvider } from "./components/adaptive";
import useAhaMoment from "./hooks/useAhaMoment";
import { BreakReminder } from "./components/adaptive";
import { PersonaProvider } from "./context/PersonaContext";

// ⭐ PHASE 9.2: Import Pitch Mode Provider
import { PitchModeProvider, usePitchMode } from "./contexts/PitchModeContext";

// CSS imports
import "./index.css";
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
import "./styles/layout-system.css";
import "./styles/entrance.css";
import "./styles/heartbeat.css";
import "./styles/palette.override.css";
import "./styles/wedge-hotfix.css";
import "./styles/mobile-overrides.css";
import "./styles/persona-themes.css";
import "./styles/card-tiers.css";
import "./styles/status-colors.css";

import { scrollToAnchorFromHash } from "./utils/anchor";
import { Menu, X } from "lucide-react";

import {
  MESSENGER_V1,
  BRAND_V2,
  DISCOVERY_V1,
  ADMIN_CONSOLE_V1,
  PULSE_ADMIN_V1,
  PUBLIC_PAGES_V1,
  FOCUS_DOCK_V1,
} from "./config/flags.js";

import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./components/Register";

const lazyWithPreload = (factory) => {
  const Component = lazy(factory);
  Component.preload = factory;
  return Component;
};

const Roadmap = lazyWithPreload(() => import("./pages/Roadmap"));
const Landing = lazyWithPreload(() => import("./pages/Landing"));
const Home = lazyWithPreload(() => import("./pages/Home"));
const Projects = lazyWithPreload(() => import("./pages/Projects"));
const Settings = lazyWithPreload(() => import("./pages/Settings"));
const Profile = lazyWithPreload(() => import("./pages/Profile"));
const ProjectHome = lazyWithPreload(() => import("./pages/ProjectHome"));
const DMPage = lazyWithPreload(() => import("./pages/DMPage.jsx"));
const Messages = lazyWithPreload(() => import("./pages/Messages.jsx"));
const PublicProjectStatus = lazyWithPreload(() => import("./pages/PublicProjectStatus"));
const SearchPage = lazyWithPreload(() => import("./pages/SearchPage"));
const AcceptInvite = lazyWithPreload(() => import("./components/AcceptInvite.jsx"));
const Discover = lazyWithPreload(() => import("./pages/Discover.jsx"));
const AdminModerationProjects = lazyWithPreload(() => import("./pages/admin/AdminModerationProjects.jsx"));
const PulseAdmin = lazyWithPreload(() => import("./pages/admin/PulseAdmin.jsx"));
const Analytics = lazyWithPreload(() => import("./pages/Analytics.jsx"));
const NotificationSettings = lazyWithPreload(() => import("./pages/NotificationSettings"));
const PWASettings = lazyWithPreload(() => import("./components/pwa/PWASettings"));
const Community = lazyWithPreload(() => import("./pages/Community"));
const PublicProfile = lazyWithPreload(() => import("./pages/profile/PublicProfile"));
const HallOfFame = lazyWithPreload(() => import("./pages/HallOfFame"));
const ProjectSettings = lazyWithPreload(() => import("./pages/project/ProjectSettings"));
const Onboarding = lazyWithPreload(() => import("./pages/Onboarding"));

const MobileTabBar = lazyWithPreload(() => import("./components/MobileTabBar"));

export const preloadRoute = (routeName) => {
  const routes = { Home, Projects, Settings, Profile, Discover, Messages, Community, Analytics, HallOfFame };
  if (routes[routeName] && routes[routeName].preload) {
    routes[routeName].preload().catch(() => {});
  }
};

const Sidebar = lazy(() => import("./components/Sidebar"));
const LayoutSkin = lazy(() => import("./components/LayoutSkin.jsx"));
const MiniSprintWidget = lazy(() => import("./components/global/MiniSprintWidget"));
const PinnedDrawer = lazy(() => import("./components/global/PinnedDrawer.jsx"));
const FocusDock = lazy(() => import("./components/focus/FocusDock.jsx"));
const FocusToasts = lazy(() => import("./components/toast/FocusToasts.jsx"));
const MentorDock = lazy(() => import("./components/mentor/MentorDock.jsx"));
const LeaderboardDock = lazy(() => import("./components/momentum/LeaderboardDock.jsx"));
const MessengerPanel = lazy(() => import("./components/messenger/MessengerPanel.jsx"));
const ShipFlash = lazy(() => import("./components/effects/ShipFlash"));
const CelebrationRouter = lazy(() => import("./components/celebrations/CelebrationRouter"));
const ShortcutProvider = lazy(() => import("./components/shortcuts/ShortcutProvider"));
const ShortcutGuide = lazy(() => import("./components/shortcuts/ShortcutGuide"));
const PublicRoutes = lazy(() => import("./routes/publicRoutes.jsx"));
const WelcomeBack = lazy(() => import("./components/context/WelcomeBack"));
const ContextIndicator = lazy(() => import("./components/context/ContextIndicator"));
const FlowIndicator = lazy(() => import("./components/flow/FlowIndicator").then((m) => ({ default: m.default })));
const MomentumAura = lazy(() => import("./components/momentum/MomentumAura").then((m) => ({ default: m.default })));

const CommandPaletteWrapper = lazy(() => import("./components/navigation/CommandPalette").then((m) => ({ default: m.CommandPaletteProvider })));
const KeyboardShortcutsModal = lazy(() => import("./components/navigation/KeyboardShortcuts"));
const NotificationCenter = lazy(() => import("./components/navigation/NotificationCenter"));
const GlobalPulseBar = lazy(() => import("./components/ui/GlobalPulseBar"));
const QuickActionsButton = lazy(() => import("./components/navigation/QuickActions"));

const UserProvider = lazy(() => import("./context/UserContext").then((m) => ({ default: m.default })));
const SprintProvider = lazy(() => import("./context/SprintContext").then((m) => ({ default: m.SprintProvider })));
const ChatProvider = lazy(() => import("./context/ChatContext.jsx").then((m) => ({ default: m.ChatProvider })));
const FocusProvider = lazy(() => import("./context/FocusContext.jsx").then((m) => ({ default: m.FocusProvider })));
const MessageProvider = lazy(() => import("./context/MessageContext.jsx").then((m) => ({ default: m.MessageProvider })));

import { UserContext } from "./context/UserContext";
import FeatureGate from "./utils/FeatureGate.jsx";

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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/home" replace />;
  return children;
}

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

function SidebarOverlay({ show, onClick }) {
  return (
    <div
      className={`sidebar-overlay ${show ? "active" : ""}`}
      onClick={onClick}
    />
  );
}

function ContextTracker() {
  useContextTracking();
  return null;
}

function HeartbeatProvider({ children }) {
  const { currentLevel, levelName, isTransitioning, isOnFire } =
    useMomentumHeartbeat({
      enabled: true,
      onLevelChange: ({ previousName, newName, direction }) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`[Momentum Heartbeat] ${previousName} → ${newName} (${direction})`);
        }
      },
    });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      document.body.setAttribute("data-momentum-debug", "true");
    }
    return () => {
      document.body.removeAttribute("data-momentum-debug");
    };
  }, []);

  return children;
}

function CommandControlLayer({ children, projects = [] }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { logout } = useAuth();
  
  // ⭐ PHASE 9.2: Consume Pitch Mode Context
  const { togglePitchMode } = usePitchMode();

  useKeyboardShortcut("cmd+/", () => setShortcutsOpen(true), {
    id: "show-shortcuts",
    description: "Show keyboard shortcuts",
    category: "General",
  });

  // ⭐ PHASE 9.2: Stealth Pitch Mode Toggle
  useKeyboardShortcut("cmd+shift+p", () => {
    togglePitchMode();
  }, {
    id: "toggle-pitch-mode",
    hidden: true,
    allowInInput: true,
  });

  const handleCommandAction = (action) => {
    if (!action) return;
    switch (action.type) {
      case "modal":
        if (action.modal === "shortcuts") setShortcutsOpen(true);
        break;
      case "callback":
        if (action.callback === "logout") logout();
        break;
      default:
        console.log("[CommandControl] Unknown action:", action);
    }
  };

  const handleQuickAction = (actionId) => {
    console.log("[QuickActions] Action triggered:", actionId);
  };

  return (
    <Suspense fallback={null}>
      <CommandPaletteWrapper projects={projects} onAction={handleCommandAction}>
        {children}
        <KeyboardShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
        <GlobalPulseBar />
        <QuickActionsButton onAction={handleQuickAction} />
      </CommandPaletteWrapper>
    </Suspense>
  );
}

function AuthenticatedApp({ children, userData }) {
   const ahaMoment = useAhaMoment();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PersonaProvider>
      <SocketProvider>
        <NotificationsProvider>
          <UserProvider>
            <MessageProvider>
              <SprintProvider>
                <Suspense fallback={null}>
                  <ShortcutProvider>
                <CommandControlLayer projects={[]}>
                  <FlowStateProvider>
                    <ContextPreservationProvider>
                      <MomentumProvider>
                        <AdaptiveDensityProvider
                          userName={userData?.firstName || "there"}
                        >
                          <FocusEngineProvider>
                            <FocusSessionProvider>
                              <AppEntrance
                                userName={userData?.firstName || "there"}
                                streakDays={userData?.streakDays || 0}
                                enabled={true}
                                showWelcomeToast={true}
                              >
                                <HeartbeatProvider>
                                  <Suspense fallback={null}>
                                    <MomentumAura />
                                  </Suspense>
                                  {FOCUS_DOCK_V1 ? (
                                    <FocusProvider>
                                      <ContextTracker />
                                      <Suspense fallback={null}>
                                        <ContextIndicator />
                                      </Suspense>
                                      <Suspense fallback={null}>
                                        <FlowIndicator position="bottom-left" />
                                      </Suspense>
                                      {children}
                                    </FocusProvider>
                                  ) : (
                                    <>
                                      <ContextTracker />
                                      <Suspense fallback={null}>
                                        <ContextIndicator />
                                      </Suspense>
                                      <Suspense fallback={null}>
                                        <FlowIndicator position="bottom-left" />
                                      </Suspense>
                                      {children}
                                    </>
                                  )}
                                </HeartbeatProvider>
                              </AppEntrance>
                            </FocusSessionProvider>
                          </FocusEngineProvider>
                          <Suspense fallback={null}>
                            <BreakReminder position="bottom-right" />
                          </Suspense>
                        </AdaptiveDensityProvider>
                        <AhaMomentToast
                          show={ahaMoment.showToast}
                          insight={ahaMoment.currentInsight}
                          onView={ahaMoment.viewInsight}
                          onDismiss={ahaMoment.dismissInsight}
                        />
                        <Suspense fallback={null}>
                          <CelebrationRouter />
                        </Suspense>
                        <Suspense fallback={null}>
                          <ShortcutGuide />
                        </Suspense>
                      </MomentumProvider>
                    </ContextPreservationProvider>
                  </FlowStateProvider>
                </CommandControlLayer>
                  </ShortcutProvider>
                </Suspense>
              </SprintProvider>
            </MessageProvider>
          </UserProvider>
        </NotificationsProvider>
      </SocketProvider>
      </PersonaProvider>
    </Suspense>
  );
}

function AppRoutes() {
  const { user: authUser, logout, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = [
    "/login",
    "/create-account",
    "/forgot-password",
    "/landing",
    "/onboarding",
  ].includes(location.pathname);
  const showAppChrome = authUser && !isAuthPage;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {showAppChrome && (
        <>
          <SidebarToggle
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <SidebarOverlay
            show={sidebarOpen}
            onClick={() => setSidebarOpen(false)}
          />
          <Suspense fallback={null}>
            <div className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
              <Sidebar />
            </div>
          </Suspense>

          <Navbar user={authUser} onLogout={logout} />
        </>
      )}

      <div className="main-content border-none outline-none ring-0 !rounded-none !m-0 !p-0">
        <div className="content-wrapper border-none shadow-none !rounded-none !m-0 !p-0">
          <Suspense
            fallback={
              <div className="px-6 py-10 text-center text-slate-500">
                Loading...
              </div>
            }
          >
            <ScrollToHash />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="/create-account" element={<PublicOnlyRoute><CreateAccount /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/invite/accept" element={<AcceptInvite />} />
              {PUBLIC_PAGES_V1 && <Route path="/p/*" element={<PublicRoutes />} />}
              <Route path="/status/:token" element={<PublicProjectStatus />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectHome /></ProtectedRoute>} />
              <Route path="/projects/:id/settings" element={<ProtectedRoute><ProjectSettings /></ProtectedRoute>} />
              <Route path="/projects/:id/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
              <Route path="/settings/app" element={<ProtectedRoute><PWASettings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<PublicProfile />} />
              <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/projects/:projectId/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/privacy-manifesto" element={<PrivacyManifesto />} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/hall-of-fame" element={<ProtectedRoute><HallOfFame /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
              {ADMIN_CONSOLE_V1 && <Route path="/admin/console" element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />}
              {PULSE_ADMIN_V1 && <Route path="/admin/pulse" element={<ProtectedRoute><PulseAdmin /></ProtectedRoute>} />}
              {ADMIN_CONSOLE_V1 && <Route path="/admin/moderation/projects" element={<ProtectedRoute><AdminModerationProjects /></ProtectedRoute>} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      {showAppChrome && (
        <Suspense fallback={null}>
          {MESSENGER_V1 && <MessengerPanel />}
          <MiniSprintWidget />
          <PinnedDrawer />
          {FOCUS_DOCK_V1 && <FocusDock />}
          {FOCUS_DOCK_V1 && <FocusToasts />}
          <MentorDock />
          <LeaderboardDock />
          <ShipFlash />
          <InstallPrompt />
          <MobileTabBar user={authUser} />
        </Suspense>
      )}

      <ToastHost />
    </>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* ⭐ PHASE 9.2: Wrap Application in PitchModeProvider */}
        <PitchModeProvider>
          <SoundProvider>
            <NewToastProvider>
              <ToastProvider>
                <OldToastProvider>
                  <Router>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LayoutSkin>
                        <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">
                          <AuthCheck />
                        </div>
                      </LayoutSkin>
                    </Suspense>
                  </Router>
                </OldToastProvider>
              </ToastProvider>
            </NewToastProvider>
          </SoundProvider>
        </PitchModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

function AuthCheck() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  const userData = user ? { firstName: user.firstName || "there", streakDays: user.streakDays || 7, shipsToday: user.shipsToday || 2 } : null;

  if (user) {
    return (
      <AuthenticatedApp userData={userData}>
        <AppRoutes />
      </AuthenticatedApp>
    );
  }

  return <AppRoutes />;
}

export default App;
