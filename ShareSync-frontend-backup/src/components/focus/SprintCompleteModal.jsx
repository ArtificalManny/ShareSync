// src/components/focus/SprintCompleteModal.jsx
// Deprecated UI: Ghosted for frictionless flow state. 
// Auto-resolves and fires confetti without interrupting the user.

import { useEffect } from "react";
import celebrate from "../../utils/celebrate";

export default function SprintCompleteModal({ open, onClose }) {
  useEffect(() => {
    if (open) {
      // 1. Fire the dopamine hit
      try { celebrate(); } catch {}
      
      // 2. Instantly auto-close to prevent state locks in the parent
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  }, [open, onClose]);

  // 3. Render absolutely nothing to the screen
  return null;
}
