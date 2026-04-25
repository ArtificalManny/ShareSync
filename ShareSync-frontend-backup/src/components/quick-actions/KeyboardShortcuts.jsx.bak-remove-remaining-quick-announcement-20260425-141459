import React, { useState } from 'react';
import { Keyboard, X, Command } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) return null; // Only show on desktop

  const shortcuts = [
    { keys: ['⌘/Ctrl', 'K'], action: 'Quick Ship', description: 'Log a win instantly' },
    { keys: ['⌘/Ctrl', 'Shift', 'A'], action: 'Quick Announcement', description: 'Post team update' },
    { keys: ['⌘/Ctrl', 'Enter'], action: 'Submit', description: 'When in Quick Ship modal' },
    { keys: ['Esc'], action: 'Close', description: 'Close any modal' },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all z-40 group"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Command className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Shortcuts List */}
            <div className="space-y-4">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-semibold text-white text-sm">{shortcut.action}</p>
                    <p className="text-xs text-slate-400 mt-1">{shortcut.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-slate-300">
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && (
                          <span className="text-slate-500 text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs font-mono">?</kbd> anytime to view shortcuts
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default KeyboardShortcuts;
