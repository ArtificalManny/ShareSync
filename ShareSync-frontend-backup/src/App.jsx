// src/App.jsx - PERFORMANCE OPTIMIZED + TOAST SYSTEM ENABLED + NOTIFICATION SETTINGS + PWA + COMMUNITY + PUBLIC PROFILES + HALL OF FAME + PROJECT SETTINGS + CONTEXT TRACKING + WELCOME BACK + CONTEXT INDICATOR + FLOW STATE + SOUND SYSTEM + PHASE N: COMMAND & CONTROL + ALIVE AWARE
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE A: Emotional Immediacy + Momentum Heartbeat
// PHASE F: The Sound of Progress
// PHASE N: Command & Control System
// PHASE 2A: WebSocket Socket Provider ⭐ NEW
// ALIVE AWARE: Adaptive Density + Fatigue Detection + Context Memory
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useContext, Suspense, lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// ⭐ PERFORMANCE: Only load heavy contexts AFTER authentication
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider as OldToastProvider } from "./context/ToastContext";
import ToastProvider, { ToastHost } from "./components/ui/toast.jsx";
// ⭐ NEW TOAST SYSTEM (MetaLab Design Sprint - Day 5)
import { ToastProvider as NewToastProvider } from "./components/common/Toast";
import ErrorBoundary from "./ErrorBoundary";

// ⭐ PHASE 2A: Socket Provider for real-time features
import { SocketProvider } from "./context/SocketContext";

// ⭐ PHASE N: Notifications shared state (global unread + realtime)
import { NotificationsProvider } from "./context/NotificationsContext";

// ⭐ DAY 7: Context Tracking Hook
import { useContextTracking } from "./hooks/useContextTracking";

// ⭐ PHASE 6: Flow State Provider
import { FlowStateProvider } from "./contexts/FlowStateContext";

// ⭐ PHASE 6: Context Preservation Provider
import { ContextPreservationProvider } from "./contexts/ContextPreservationContext";

// ⭐ PHASE 6: Momentum Visualization Provider
import { MomentumProvider } from "./contexts/MomentumContext";

// ⭐ PHASE 10.3: Focus Session Provider
import { FocusSessionProvider } from "./contexts/FocusSessionContext";

// ⭐ PHASE A: Entrance Animation + Momentum Heartbeat
import AppEntrance from "./components/onboarding/AppEntrance";
import useMomentumHeartbeat from "./hooks/useMomentumHeartbeat";

// ⭐ PHASE F: Sound System
import { SoundProvider } from "./contexts/SoundContext";

// ⭐ PHASE N: Keyboard Shortcuts Hook (non-lazy, needed globally)
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcuts";

// ⭐ PWA Components
import InstallPrompt from "./components/pwa/InstallPrompt";

import PrivacyManifesto from "./pages/PrivacyManifesto";

// ⭐ PHASE H: Focus Engine Provider
import { FocusEngineProvider } from "./contexts/FocusEngineContext";

// ⭐ ALIVE AWARE: Adaptive Density System
import { AdaptiveDensityProvider } from "./components/adaptive";
import { BreakReminder } from "./components/adaptive";

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
// ⭐ PHASE A: New CSS imports
import "./styles/entrance.css";
import "./styles/heartbeat.css";
import "./styles/palette.override.css";

import { scrollToAnchorFromHash } from "./utils/anchor";
import { Menu, X } from "lucide-react";

// Feature flags
import {
  MESSENGER_V1,
  BRAND_V2,
  DISCOVERY_V1,
  ADMIN_CONSOLE_V1,
  PULSE_ADMIN_V1,
  PUBLIC_PAGES_V1,
  FOCUS_DOCK_V1,
} from "./config/flags.js";

// ⭐ Auth pages (NOT lazy - needed immediately)
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./components/Register";

const Roadmap = lazy(() => import("./pages/Roadmap"));
// ⭐ ALL other pages - lazy load
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const ProjectHome = lazy(() => import("./pages/ProjectHome"));
const DMPage = lazy(() => import("./pages/DMPage.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const PublicProjectStatus = lazy(() => import("./pages/PublicProjectStatus"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AcceptInvite = lazy(() => import("./components/AcceptInvite.jsx"));
const Discover = lazy(() => import("./pages/Discover.jsx"));
const AdminModerationProjects = lazy(() =>
  import("./pages/admin/AdminModerationProjects.jsx")
);
const PulseAdmin = lazy(() => import("./pages/admin/PulseAdmin.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const PWASettings = lazy(() => import("./components/pwa/PWASettings"));

// ⭐ WEEK 9 DAY 1-2: COMMUNITY PAGE
const Community = lazy(() => import("./pages/Community"));

// ⭐ WEEK 9 DAY 3-4: PUBLIC PROFILE PAGE
const PublicProfile = lazy(() => import("./pages/profile/PublicProfile"));

// ⭐ WEEK 9 DAY 5-6: HALL OF FAME PAGE
const HallOfFame = lazy(() => import("./pages/HallOfFame"));

// ⭐ PROJECT SETTINGS PAGE
const ProjectSettings = lazy(() => import("./pages/project/ProjectSettings"));

// ⭐ PHASE 9: Onboarding
const Onboarding = lazy(() => import("./pages/Onboarding"));

// ⭐ Lazy load heavy components
const Sidebar = lazy(() => import("./components/Sidebar"));
const LayoutSkin = lazy(() => import("./components/LayoutSkin.jsx"));
const MiniSprintWidget = lazy(() => import("./components/global/MiniSprintWidget"));
// ❌ TEMPORARILY DISABLED - Component has dependency issues
// const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));
const PinnedDrawer = lazy(() => import("./components/global/PinnedDrawer.jsx"));
const FocusDock = lazy(() => import("./components/focus/FocusDock.jsx"));
const FocusToasts = lazy(() => import("./components/toast/FocusToasts.jsx"));
const MentorDock = lazy(() => import("./components/mentor/MentorDock.jsx"));
const LeaderboardDock = lazy(() => import("./components/momentum/LeaderboardDock.jsx"));
const MessengerPanel = lazy(() => import("./components/messenger/MessengerPanel.jsx"));
const ShipFlash = lazy(() => import("./components/effects/ShipFlash"));
const PublicRoutes = lazy(() => import("./routes/publicRoutes.jsx"));

// ⭐ DAY 8: Welcome Back Modal
const WelcomeBack = lazy(() => import("./components/context/WelcomeBack"));

// ⭐ DAY 9: Context Indicator
const ContextIndicator = lazy(() => import("./components/context/ContextIndicator"));

// ⭐ PHASE 6: Flow State Indicator
const FlowIndicator = lazy(() =>
  import("./components/flow/FlowIndicator").then((m) => ({ default: m.default }))
);

// ⭐ PHASE 6: Momentum Aura (subtle background)
const MomentumAura = lazy(() =>
  import("./components/momentum/MomentumAura").then((m) => ({
    default: m.default,
  }))
);

// ⭐ PHASE N: Command & Control Components (lazy loaded)
const CommandPaletteWrapper = lazy(() =>
  import("./components/navigation/CommandPalette").then((m) => ({
    default: m.CommandPaletteProvider,
  }))
);
const KeyboardShortcutsModal = lazy(() =>
  import("./components/navigation/KeyboardShortcuts")
);
const NotificationCenter = lazy(() =>
  import("./components/navigation/NotificationCenter")
);
const GlobalPulseBar = lazy(() => import("./components/ui/GlobalPulseBar"));
const QuickActionsButton = lazy(() =>
  import("./components/navigation/QuickActions")
);

// ⭐ Lazy load context providers
const UserProvider = lazy(() =>
  import("./context/UserContext").then((m) => ({ default: m.default }))
);
const SprintProvider = lazy(() =>
  import("./context/SprintContext").then((m) => ({ default: m.SprintProvider }))
);
const ChatProvider = lazy(() =>
  import("./context/ChatContext.jsx").then((m) => ({ default: m.ChatProvider }))
);
const FocusProvider = lazy(() =>
  import("./context/FocusContext.jsx").then((m) => ({
    default: m.FocusProvider,
  }))
);
// ⭐ PHASE N: Using new CommandPaletteProvider instead of old one
// const CommandPaletteProvider = lazy(() => import("./hooks/useCommandPalette").then(m => ({ default: m.CommandPaletteProvider })));
const MessageProvider = lazy(() =>
  import("./context/MessageContext.jsx").then((m) => ({
    default: m.MessageProvider,
  }))
);

import { UserContext } from "./context/UserContext";
import FeatureGate from "./utils/FeatureGate.jsx";
import useBrandTheme from "./hooks/useBrandTheme.js";

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

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

/**
 * ⭐ DAY 7: Context Tracking Initializer
 * Renders nothing, just activates the tracking hook
 * Must be inside Router + have access to auth
 */
function ContextTracker() {
  useContextTracking();
  return null;
}

/**
 * ⭐ PHASE A: Momentum Heartbeat Provider
 * Activates the 30-second heartbeat that makes the interface breathe
 */
function HeartbeatProvider({ children }) {
  const { currentLevel, levelName, isTransitioning, isOnFire } =
    useMomentumHeartbeat({
      enabled: true,
      onLevelChange: ({ previousName, newName, direction }) => {
        // Log level changes for debugging (remove in production)
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Momentum Heartbeat] ${previousName} → ${newName} (${direction})`
          );
        }
      },
    });

  // Add debug mode in development
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

/**
 * ⭐ PHASE N: Command & Control Integration
 * Handles keyboard shortcuts modal and command palette actions
 */
function CommandControlLayer({ children, projects = [] }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { logout } = useAuth();

  // ⭐ PHASE N: Global keyboard shortcut for shortcuts modal
  useKeyboardShortcut("cmd+/", () => setShortcutsOpen(true), {
    id: "show-shortcuts",
    description: "Show keyboard shortcuts",
    category: "General",
  });

  // ⭐ PHASE N: Handle command palette actions
  const handleCommandAction = (action) => {
    if (!action) return;

    switch (action.type) {
      case "modal":
        if (action.modal === "shortcuts") setShortcutsOpen(true);
        // Add other modal handlers here as needed
        // if (action.modal === 'ship') openShipModal();
        // if (action.modal === 'task') openTaskModal();
        break;
      case "callback":
        if (action.callback === "logout") logout();
        // Add other callback handlers here
        // if (action.callback === 'toggleFireMode') toggleFireMode();
        // if (action.callback === 'startFocus') startFocusSession();
        break;
      default:
        console.log("[CommandControl] Unknown action:", action);
    }
  };

  // ⭐ PHASE N: Handle quick action button clicks
  const handleQuickAction = (actionId) => {
    console.log("[QuickActions] Action triggered:", actionId);
    // Route to appropriate handler
    switch (actionId) {
      case "ship":
        // Open ship modal
        break;
      case "task":
        // Open task modal
        break;
      case "objective":
        // Open objective modal
        break;
      case "note":
        // Open quick note
        break;
      default:
        break;
    }
  };

  return (
    <Suspense fallback={null}>
      <CommandPaletteWrapper projects={projects} onAction={handleCommandAction}>
        {children}

        {/* ⭐ PHASE N: Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        {/* ⭐ PHASE N: Global Pulse Bar (bottom of screen) */}
        <GlobalPulseBar />

        {/* ⭐ PHASE N: Quick Actions FAB */}
        <QuickActionsButton onAction={handleQuickAction} />
      </CommandPaletteWrapper>
    </Suspense>
  );
}

function AuthenticatedApp({ children, userData }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* ⭐ PHASE 2A: Socket Provider wraps authenticated content for real-time */}
      <SocketProvider>
        {/* ⭐ PHASE N: Notifications provider must be INSIDE SocketProvider */}
        <NotificationsProvider>
          <UserProvider>
            <MessageProvider>
              <SprintProvider>
                {/* ⭐ PHASE N: Command & Control wraps everything for global shortcuts */}
                <CommandControlLayer projects={[]}>
                  {/* ⭐ PHASE 6: Flow State Provider wraps authenticated content */}
                  <FlowStateProvider>
                    {/* ⭐ PHASE 6: Context Preservation Provider */}
                    <ContextPreservationProvider>
                      {/* ⭐ PHASE 6: Momentum Visualization Provider */}
                      <MomentumProvider>
                        {/* ⭐ ALIVE AWARE: Adaptive Density Provider */}
                        <AdaptiveDensityProvider
                          userName={userData?.firstName || "there"}
                        >
                          {/* ⭐ PHASE H: Focus Engine Provider */}
                          <FocusEngineProvider>
                            {/* ⭐ PHASE 10.3: Focus Session Provider */}
                            <FocusSessionProvider>
                              {/* ⭐ PHASE A: App Entrance Animation */}
                              <AppEntrance
                                userName={userData?.firstName || "there"}
                                streakDays={userData?.streakDays || 0}
                                enabled={true}
                                showWelcomeToast={true}
                              >
                                {/* ⭐ PHASE A: Momentum Heartbeat */}
                                <HeartbeatProvider>
                                  {/* ⭐ PHASE 6: Momentum Aura (subtle background overlay) */}
                                  <Suspense fallback={null}>
                                    <MomentumAura />
                                  </Suspense>
                                  {FOCUS_DOCK_V1 ? (
                                    <FocusProvider>
                                      {/* ⭐ DAY 7: Context tracking for authenticated users */}
                                      <ContextTracker />
                                      {/* ⭐ DAY 8: Welcome Back modal for returning users */}
                                      <Suspense fallback={null}>
                                        <WelcomeBack />
                                      </Suspense>
                                      {/* ⭐ DAY 9: Context save indicator */}
                                      <Suspense fallback={null}>
                                        <ContextIndicator />
                                      </Suspense>
                                      {/* ⭐ PHASE 6: Flow state indicator */}
                                      <Suspense fallback={null}>
                                        <FlowIndicator position="bottom-left" />
                                      </Suspense>
                                      {children}
                                    </FocusProvider>
                                  ) : (
                                    <>
                                      {/* ⭐ DAY 7: Context tracking for authenticated users */}
                                      <ContextTracker />
                                      {/* ⭐ DAY 8: Welcome Back modal for returning users */}
                                      <Suspense fallback={null}>
                                        <WelcomeBack />
                                      </Suspense>
                                      {/* ⭐ DAY 9: Context save indicator */}
                                      <Suspense fallback={null}>
                                        <ContextIndicator />
                                      </Suspense>
                                      {/* ⭐ PHASE 6: Flow state indicator */}
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

                          {/* ⭐ ALIVE AWARE: Break Reminder (positioned bottom-right) */}
                          <Suspense fallback={null}>
                            <BreakReminder position="bottom-right" />
                          </Suspense>
                        </AdaptiveDensityProvider>
                      </MomentumProvider>
                    </ContextPreservationProvider>
                  </FlowStateProvider>
                </CommandControlLayer>
              </SprintProvider>
            </MessageProvider>
          </UserProvider>
        </NotificationsProvider>
      </SocketProvider>
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

          <div className="navbar">
            <Navbar user={authUser} onLogout={logout} />
          </div>
        </>
      )}

      <div className="main-content border-none outline-none ring-0">
  <div className="content-wrapper border-none shadow-none">
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

              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/create-account"
                element={
                  <PublicOnlyRoute>
                    <CreateAccount />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPassword />
                  </PublicOnlyRoute>
                }
              />
              {/* ⭐ PHASE 9: Onboarding Flow */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route path="/landing" element={<Landing />} />
              <Route path="/invite/accept" element={<AcceptInvite />} />
              {PUBLIC_PAGES_V1 && <Route path="/p/*" element={<PublicRoutes />} />}
              <Route path="/status/:token" element={<PublicProjectStatus />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectHome />
                  </ProtectedRoute>
                }
              />

              {/* ⭐ PROJECT SETTINGS ROUTE */}
              <Route
                path="/projects/:id/settings"
                element={
                  <ProtectedRoute>
                    <ProjectSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/roadmap"
                element={
                  <ProtectedRoute>
                    <Roadmap />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/app"
                element={
                  <ProtectedRoute>
                    <PWASettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* ⭐ WEEK 9 DAY 3-4: PUBLIC PROFILE ROUTE */}
              <Route path="/profile/:username" element={<PublicProfile />} />

              <Route
                path="/me"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route path="/privacy-manifesto" element={<PrivacyManifesto />} />

              {/* ⭐ WEEK 9 DAY 1-2: COMMUNITY ROUTE */}
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />

              {/* ⭐ WEEK 9 DAY 5-6: HALL OF FAME ROUTE */}
              <Route
                path="/hall-of-fame"
                element={
                  <ProtectedRoute>
                    <HallOfFame />
                  </ProtectedRoute>
                }
              />

              {/* ⭐ MESSAGES ROUTES - Uses MessageProvider from AuthenticatedApp */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:id"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <Discover />
                  </ProtectedRoute>
                }
              />

              {ADMIN_CONSOLE_V1 && (
                <Route
                  path="/admin/console"
                  element={
                    <ProtectedRoute>
                      <AdminConsole />
                    </ProtectedRoute>
                  }
                />
              )}
              {PULSE_ADMIN_V1 && (
                <Route
                  path="/admin/pulse"
                  element={
                    <ProtectedRoute>
                      <PulseAdmin />
                    </ProtectedRoute>
                  }
                />
              )}

              {ADMIN_CONSOLE_V1 && (
                <Route
                  path="/admin/moderation/projects"
                  element={
                    <ProtectedRoute>
                      <AdminModerationProjects />
                    </ProtectedRoute>
                  }
                />
              )}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      {showAppChrome && (
        <Suspense fallback={null}>
          {MESSENGER_V1 && <MessengerPanel />}
          <MiniSprintWidget />
          {/* ❌ TEMPORARILY DISABLED - Component has dependency issues */}
          {/* <QuickNotesDrawer /> */}
          <PinnedDrawer />
          {FOCUS_DOCK_V1 && <FocusDock />}
          {FOCUS_DOCK_V1 && <FocusToasts />}
          <MentorDock />
          <LeaderboardDock />
          <ShipFlash />
          {/* ⭐ PWA Install Prompt */}
          <InstallPrompt />
        </Suspense>
      )}

      <ToastHost />
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

  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* ⭐ PHASE F: Sound System - Wraps entire app for global sound access */}
        <SoundProvider>
          <NewToastProvider>
            <ToastProvider>
              <OldToastProvider>
                <Router>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LayoutSkin>
                      <div className="app-container" {...containerAttrs}>
                        <AuthCheck />
                      </div>
                    </LayoutSkin>
                  </Suspense>
                </Router>
              </OldToastProvider>
            </ToastProvider>
          </NewToastProvider>
        </SoundProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

function AuthCheck() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // ⭐ PHASE A: Prepare user data for entrance animation
  const userData = user
    ? {
        firstName: user.firstName || "there",
        streakDays: user.streakDays || 7, // TODO: Get from actual user data
        shipsToday: user.shipsToday || 2, // TODO: Get from actual user data
      }
    : null;

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
