import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

const SuccessAnimation = ({ show, message, xp }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl p-8 shadow-2xl border-4 border-white/20 animate-bounce-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <CheckCircle className="w-20 h-20 text-white animate-scale-in" />
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-spin-slow" />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
            {xp && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-yellow-300">+{xp}</span>
                <span className="text-xl font-bold text-white">XP</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scale-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out 0.1s backwards;
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SuccessAnimation;
