// src/components/navigation/CommandControlLayer.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE N: Command & Control Integration Layer
// Handles keyboard shortcuts modal, command palette actions, and quick actions
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

// Lazy load command palette components
const CommandPaletteProvider = lazy(() => 
  import('./CommandPalette').then(m => ({ default: m.CommandPaletteProvider }))
);
const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcuts'));
const GlobalPulseBar = lazy(() => import('../ui/GlobalPulseBar'));
const QuickActionsButton = lazy(() => import('./QuickActions'));

export default function CommandControlLayer({ children, projects = [] }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { logout } = useAuth();

  // Global keyboard shortcut for shortcuts modal
  useKeyboardShortcut('cmd+/', () => setShortcutsOpen(true), {
    id: 'show-shortcuts',
    description: 'Show keyboard shortcuts',
    category: 'General',
  });

  // Handle command palette actions
  const handleCommandAction = (action) => {
    if (!action) return;
    
    switch (action.type) {
      case 'modal':
        if (action.modal === 'shortcuts') setShortcutsOpen(true);
        if (action.modal === 'ship') {
          // Dispatch event for ship modal
          window.dispatchEvent(new CustomEvent('open-ship-modal'));
        }
        if (action.modal === 'task') {
          // Dispatch event for task modal
          window.dispatchEvent(new CustomEvent('open-task-modal'));
        }
        if (action.modal === 'createProject') {
          window.dispatchEvent(new CustomEvent('open-create-project-modal'));
        }
        break;
      case 'callback':
        if (action.callback === 'logout') logout();
        if (action.callback === 'setDarkTheme') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
        if (action.callback === 'setLightTheme') {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
        if (action.callback === 'toggleFireMode') {
          window.dispatchEvent(new CustomEvent('toggle-fire-mode'));
        }
        if (action.callback === 'startFocus') {
          window.dispatchEvent(new CustomEvent('start-focus-session'));
        }
        break;
      default:
        console.log('[CommandControl] Unknown action:', action);
    }
  };

  // Handle quick action button clicks
  const handleQuickAction = (actionId) => {
    console.log('[QuickActions] Action triggered:', actionId);
    switch (actionId) {
      case 'ship':
        window.dispatchEvent(new CustomEvent('open-ship-modal'));
        break;
      case 'task':
        window.dispatchEvent(new CustomEvent('open-task-modal'));
        break;
      case 'objective':
        window.dispatchEvent(new CustomEvent('open-objective-modal'));
        break;
      case 'note':
        window.dispatchEvent(new CustomEvent('open-quick-note'));
        break;
      default:
        break;
    }
  };

  return (
    <Suspense fallback={null}>
      <CommandPaletteProvider 
        projects={projects} 
        onAction={handleCommandAction}
      >
        {children}
        
        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal 
          isOpen={shortcutsOpen} 
          onClose={() => setShortcutsOpen(false)} 
        />
        
        {/* Global Pulse Bar (bottom of screen) */}
        <GlobalPulseBar />
        
        {/* Quick Actions FAB */}
        <QuickActionsButton onAction={handleQuickAction} />
      </CommandPaletteProvider>
    </Suspense>
  );
}
