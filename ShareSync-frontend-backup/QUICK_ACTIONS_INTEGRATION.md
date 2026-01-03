# Quick Actions Integration for ProjectHome.jsx

## 1. Add Imports (at the top of ProjectHome.jsx)
```javascript
// ⭐ QUICK ACTIONS IMPORTS
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';
```

## 2. Add Components (before the closing </div> of main container, around line 450)

Find this section near the end of your ProjectHome component:
```javascript
      </div>

      {/* FLOATING SHIP BUTTON - Mobile optimized */}
      <button
        onClick={() => setShowShipModal(true)}
        ...
      >
```

REPLACE the entire "FLOATING SHIP BUTTON" section with:
```javascript
      </div>

      {/* ⭐ QUICK ACTIONS - Replaces old floating ship button */}
      <QuickActionsManager projectId={id} />
      
      {/* ⭐ KEYBOARD SHORTCUTS HELPER */}
      <KeyboardShortcuts />
```

## 3. Remove Old Ship Modal Code (Optional - keep if you want both)

You can keep the existing ship modal as a fallback, or remove it since Quick Actions replaces it.

The Quick Actions Manager provides:
- Quick Ship FAB (same as old ship button, but better)
- Quick Announce FAB (new feature)
- Keyboard shortcuts (Cmd+K)
- Voice input support
- Confetti animations
- XP rewards

## 4. Test

1. Navigate to any project
2. Look for TWO floating buttons on the right:
   - Bottom: 🚀 Quick Ship (purple)
   - Above it: 📢 Quick Announce (orange)
3. Try keyboard shortcuts:
   - Cmd/Ctrl + K → Quick Ship
   - Cmd/Ctrl + Shift + A → Quick Announce
4. Test voice input in Quick Announce (tap 🎤 button)
