import './utils/clearOldMobileShellCache';
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
  useParams,
} from "react-router-dom";

// ⭐ PERFORMANCE: Only load heavy contexts AFTER authentication
import Navbar from "./components/Navbar";
import ResponsiveLayout from "./components/layout/ResponsiveLayout";
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

// ⭐ QUICK NOTES
import { NotesProvider, useNotes } from "./context/NotesContext";

// ⭐ PHASE A: Entrance Animation + Momentum Heartbeat
import AppEntrance from "./components/onboarding/AppEntrance";
import useMomentumHeartbeat from "./hooks/useMomentumHeartbeat";

// ⭐ PHASE F: Sound System
import { SoundProvider } from "./contexts/SoundContext";

// ⭐ PHASE N: Keyboard Shortcuts Hook (non-lazy, needed globally)
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcuts";

// ⭐ PWA Components
import InstallPrompt from "./components/pwa/InstallPrompt";

import AhaMomentToast from "./components/home/AhaMomentToast";

import PrivacyManifesto from "./pages/PrivacyManifesto";

// ⭐ PHASE H: Focus Engine Provider
import { FocusEngineProvider } from "./contexts/FocusEngineContext";

// ⭐ ALIVE AWARE: Adaptive Density System
import { AdaptiveDensityProvider } from "./components/adaptive";
// ✅ Priority 1: Aha Moment system
import useAhaMoment from "./hooks/useAhaMoment";
import { BreakReminder } from "./components/adaptive";

// ⭐ Priority 4.1: Persona System
import { PersonaProvider } from "./context/PersonaContext";

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
import "./styles/wedge-hotfix.css";
import "./styles/mobile-overrides.css";

// ✅ Priority 4.1: Persona theme overrides
import "./styles/persona-themes.css";

// ✅ Priority 2: Card Depth System + Status Colors
import "./styles/card-tiers.css";
import "./styles/status-colors.css";

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
import GoogleCallback from "./pages/GoogleCallback.jsx";
import CreateAccount from "./pages/CreateAccount";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./components/Register";

const Roadmap = lazy(() => import("./pages/Roadmap"));
// ⭐ ALL other pages - lazy load
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const MyWork = lazy(() => import("./pages/MyWork.jsx"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectsCreate = lazy(() => import("./pages/ProjectsCreate"));
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
const PublicProfile = lazy(() => import("./pages/profile/PublicProfile.jsx"));

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
const QuickNotesDrawer = lazy(() => import("./components/global/QuickNotesDrawer"));
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
const MessageProvider = lazy(() =>
  import("./context/MessageContext.jsx").then((m) => ({
    default: m.MessageProvider,
  }))
);

import { UserContext } from "./context/UserContext";
import FeatureGate from "./utils/FeatureGate.jsx";
import PageTitleManager from "./components/seo/PageTitleManager";
// import useBrandTheme from "./hooks/useBrandTheme.js";

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

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return <Navigate to={user ? "/home" : "/login"} replace />;
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
          console.log(
            `[Momentum Heartbeat] ${previousName} → ${newName} (${direction})`
          );
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

  useKeyboardShortcut("cmd+/", () => setShortcutsOpen(true), {
    id: "show-shortcuts",
    description: "Show keyboard shortcuts",
    category: "General",
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

                                            {/* TEMP DEBUG: disable WelcomeBack modal to rule out full-screen dark backdrop */}
                                            {/* <Suspense fallback={null}>
                                              <WelcomeBack />
                                            </Suspense> */}

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

                                            {/* TEMP DEBUG: disable WelcomeBack modal to rule out full-screen dark backdrop */}
                                            {/* <Suspense fallback={null}>
                                              <WelcomeBack />
                                            </Suspense> */}

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
                              {/* ✅ Priority 1: Aha Moment Toast */}
                              <AhaMomentToast
                                show={ahaMoment.showToast}
                                insight={ahaMoment.currentInsight}
                                onView={ahaMoment.viewInsight}
                                onDismiss={ahaMoment.dismissInsight}
                              />
                              {/* ✅ Priority 4.2: Global Celebration Router */}
                              <Suspense fallback={null}>
                                <CelebrationRouter />
                              </Suspense>
                              {/* ✅ Priority 5.4: Shortcut Guide Modal */}
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


function RootRouteRedirect() {
  const { user: authUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (authUser) {
    return <Navigate to="/home" replace />;
  }

  return <Landing />;
}

function UserProfileAlias() {
  const { username } = useParams();
  const safeUsername = encodeURIComponent(username || "");

  return <Navigate to={`/profile/${safeUsername}`} replace />;
}


function useIsPhoneViewport() {
  const [isPhone, setIsPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 900px)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(max-width: 900px)");

    const update = () => setIsPhone(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return isPhone;
}

function AppRoutes() {
  const { user: authUser, logout, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [quickNotesOpen, setQuickNotesOpen] = useState(false);
  const { notes = [] } = useNotes();

  const isAuthPage =
    [
      "/login",
      "/create-account",
      "/forgot-password",
      "/landing",
      "/onboarding",
    ].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");
  const showAppChrome = authUser && !isAuthPage;
  const isPhone = useIsPhoneViewport();
  const showDesktopChrome = showAppChrome && !isPhone;
  const showMobileChrome = showAppChrome && isPhone;

  useEffect(() => {
    const handleOpenCreateProject = () => {
      setShowCreateProjectModal(true);
    };

    window.addEventListener("ss:open-create-project", handleOpenCreateProject);
    return () => {
      window.removeEventListener("ss:open-create-project", handleOpenCreateProject);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {showDesktopChrome && (
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

          {/* IMPORTANT: do NOT wrap Navbar in another .navbar div (it already renders a .navbar header) */}
          <Navbar
            user={authUser}
            onLogout={logout}
            onOpenQuickNotes={() => setQuickNotesOpen(true)}
            quickNotesCount={notes.length}
            onOpenCreateProject={() => setShowCreateProjectModal(true)}
          />

          <Suspense fallback={null}>
            <QuickNotesDrawer
              open={quickNotesOpen}
              onClose={() => setQuickNotesOpen(false)}
            />
          </Suspense>
        </>
      )}

      <ResponsiveLayout
        enabled={showMobileChrome}
        forceMobile={isPhone}
        userName={
          authUser?.firstName ||
          authUser?.displayName ||
          authUser?.username ||
          "User"
        }
        userStatus="online"
        unreadCount={authUser?.unreadCount || 0}
        onLogout={logout}
        onCreatePress={() => setShowCreateProjectModal(true)}
        onSearchPress={() => {
          try {
            window.dispatchEvent(new CustomEvent("shortcut-action", {
              detail: { action: "COMMAND_PALETTE_OPEN" },
            }));
          } catch {}
        }}
        onNotificationPress={() => {
          try {
            window.dispatchEvent(new CustomEvent("shortcut-action", {
              detail: { action: "NOTIFICATIONS_OPEN" },
            }));
          } catch {}
        }}
      >
      {/* ⭐ DYNAMIC WEDGE FIX: Strip desktop classes entirely on mobile to kill the ghost gutter */}
      <div className={isPhone ? "w-full max-w-full m-0 p-0 overflow-x-hidden" : "main-content border-none outline-none ring-0 !rounded-none !m-0 !p-0"}>
        <div className={isPhone ? "w-full max-w-full m-0 p-0 flex-1 flex flex-col" : "content-wrapper border-none shadow-none !rounded-none !m-0 !p-0"}>
          <Suspense
            fallback={
              <div className="px-6 py-10 text-center text-slate-500">
                Loading...
              </div>
            }
          >
            <ScrollToHash />
            <PageTitleManager />
      <Routes>
              <Route path="/" element={<RootRedirect />} />

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
                path="/verify-email"
                element={
                  <PublicOnlyRoute>
                    <VerifyEmail />
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
              <Route
                path="/reset-password/:token"
                element={
                  <PublicOnlyRoute>
                    <ResetPassword />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/invite/accept" element={<AcceptInvite />} />
              {PUBLIC_PAGES_V1 && <Route path="/p/*" element={<PublicRoutes />} />}
              <Route path="/status/:token" element={<PublicProjectStatus />} />
              <Route path="/share/project/:token" element={<PublicProjectStatus />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-work"
                element={
                  <ProtectedRoute>
                    <MyWork />
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
              <Route path="/profile/:username" element={<PublicProfile />} />
              <Route path="/users/:username" element={<UserProfileAlias />} />
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
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hall-of-fame"
                element={
                  <ProtectedRoute>
                    <HallOfFame />
                  </ProtectedRoute>
                }
              />
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
      </ResponsiveLayout>

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
        </Suspense>
      )}

      {authUser && showCreateProjectModal && (
        <Suspense fallback={null}>
          <ProjectsCreate onClose={() => setShowCreateProjectModal(false)} />
        </Suspense>
      )}

      <ToastHost />
    </>
  );
}

// ⭐ MASTER THEME SWITCHER
// This physically adds or removes the 'dark' class from the <html> tag
function ThemeSync() {
  const { user } = useAuth();

  useEffect(() => {
    // Check user preferences, fallback to local storage, fallback to system
    const theme = user?.preferences?.theme || localStorage.getItem("ss.theme") || "system";
    const root = document.documentElement;

    if (
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [user?.preferences?.theme]); // Re-run whenever the user changes their theme

  return null; // This component is invisible
}

const App = () => {
  // ⭐ WEDGE FIX: We disable the floating container wrapper that pushes your app inward
  // Temporarily disable brand theme hook entirely while debugging shell/background issues
  // const { containerAttrs } = useBrandTheme({
  //   enabled: false,
  //   applyToDocument: false,
  //   defaultBrand: "v2",
  //   defaultAccent: "pandora",
  // });

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SoundProvider>
          <NewToastProvider>
            <ToastProvider>
              <OldToastProvider>
                <NotesProvider>
                  <Router>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LayoutSkin>
                        {/* ⭐ WEDGE FIX: Force w-full, h-full, min-h-screen, remove all rounding and margins */}
                        <div className="app-container w-full min-h-screen bg-slate-50 !rounded-none !m-0 !p-0 !border-0">
                          <AuthCheck />
                        </div>
                      </LayoutSkin>
                    </Suspense>
                  </Router>
                </NotesProvider>
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

  const userData = user
    ? {
        firstName: user.firstName || "there",
        streakDays: user.streakDays || 7,
        shipsToday: user.shipsToday || 2,
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
