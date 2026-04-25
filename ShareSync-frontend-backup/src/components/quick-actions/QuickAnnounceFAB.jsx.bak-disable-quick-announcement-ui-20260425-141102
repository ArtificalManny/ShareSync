import React, { useState } from 'react';
import { Megaphone, Mic } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import QuickAnnounceSheet from './QuickAnnounceSheet';

const QuickAnnounceFAB = ({ projectId }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Secondary FAB for Announcements */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${isMobile ? 'bottom-28 right-6 w-14 h-14' : 'bottom-32 right-8 w-16 h-16'} 
          bg-gradient-to-r from-orange-600 to-pink-600 rounded-full shadow-2xl 
          hover:shadow-orange-500/50 transition-all z-40 group
          hover:scale-110 active:scale-95`}
        aria-label="Quick Announcement"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Megaphone className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white group-hover:rotate-12 transition-transform`} />
          
          {/* Mic indicator */}
          <Mic className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300" />
        </div>

        {/* Tooltip on desktop */}
        {!isMobile && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl border border-orange-500/30">
              <p className="font-semibold text-sm">Quick Announcement</p>
              <p className="text-xs text-slate-400">Post update in 10 seconds</p>
            </div>
          </div>
        )}
      </button>

      {/* Bottom Sheet */}
      <QuickAnnounceSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projectId={projectId}
      />
    </>
  );
};

export default QuickAnnounceFAB;
