import React, { useState } from 'react';
import { Rocket, Zap } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import QuickShipModal from './QuickShipModal';
import QuickShipSheet from './QuickShipSheet';

const QuickShipFAB = ({ projectId }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Pulse animation on hover
  const handleMouseEnter = () => {
    setPulseAnimation(true);
    setTimeout(() => setPulseAnimation(false), 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={handleMouseEnter}
        className={`fixed ${isMobile ? 'bottom-6 right-6 w-16 h-16' : 'bottom-8 right-8 w-20 h-20'} 
          bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full shadow-2xl 
          hover:shadow-purple-500/50 transition-all z-40 group
          ${pulseAnimation ? 'animate-bounce' : 'hover:scale-110'} active:scale-95`}
        aria-label="Quick Ship"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Rocket className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} text-white group-hover:rotate-12 transition-transform`} />
          
          {/* Sparkle effect */}
          <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Tooltip on desktop */}
        {!isMobile && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl border border-purple-500/30">
              <p className="font-semibold text-sm">Quick Ship</p>
              <p className="text-xs text-slate-400">Log a win in 5 seconds</p>
            </div>
          </div>
        )}
      </button>

      {/* Modal or Bottom Sheet */}
      {isMobile ? (
        <QuickShipSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projectId={projectId}
        />
      ) : (
        <QuickShipModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projectId={projectId}
        />
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-bounce {
          animation: bounce 0.6s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default QuickShipFAB;
