// src/components/onboarding/steps/FirstTaskStep.jsx
// Deprecated UI: Ghosted to prevent the glitchy onboarding loop.
// Instantly auto-resolves to keep the user in a frictionless flow state.

import { useEffect } from "react";

export default function FirstTaskStep({ onNext, onComplete }) {
  useEffect(() => {
    // Instantly tell the parent onboarding engine that we are done here
    if (typeof onNext === 'function') onNext();
    if (typeof onComplete === 'function') onComplete();
  }, [onNext, onComplete]);

  // Render absolutely nothing to the screen
  return null;
}
