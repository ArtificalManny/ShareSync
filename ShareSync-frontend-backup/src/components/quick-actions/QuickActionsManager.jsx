import React, { useEffect } from 'react';
import QuickShipFAB from './QuickShipFAB';
import QuickAnnounceFAB from './QuickAnnounceFAB';
import { useIsMobile } from '../../hooks/useMobile';

const QuickActionsManager = ({ projectId }) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + K for Quick Ship
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('[aria-label="Quick Ship"]')?.click();
      }
      
      // Cmd/Ctrl + Shift + A for Quick Announcement
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        document.querySelector('[aria-label="Quick Announcement"]')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Don't show on mobile if no project selected
  if (isMobile && !projectId) {
    return null;
  }

  return (
    <>
      {/* Quick Ship FAB - Always visible */}
      <QuickShipFAB projectId={projectId} />
      
      {/* Quick Announce FAB - Only show if project is selected */}
      {projectId && <QuickAnnounceFAB projectId={projectId} />}
    </>
  );
};

export default QuickActionsManager;
