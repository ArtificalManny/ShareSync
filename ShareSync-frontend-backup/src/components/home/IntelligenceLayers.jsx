// src/components/Home/IntelligenceLayers.jsx
import React, { useState } from "react";
import { Info, TrendingUp, Users, Zap, X } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   1. INTERACTIVE VELOCITY STATS
   Adds "Deep-Hover" data visualization without cluttering the UI.
───────────────────────────────────────────────────────────────────────── */
const VelocityStat = ({ label, value, color, detail }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div 
      className="relative group cursor-help"
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className={`text-2xl font-black italic ${color}`}>{value}</div>
      <div className="text-[9px] font-bold text-neutral-500 uppercase flex items-center gap-1">
        {label} <Info className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Hover Card: The "Hidden" Power */}
      {showDetail && (
        <div className="absolute bottom-full mb-4 left-0 w-48 p-3 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[10px] text-neutral-400 leading-relaxed">{detail}</p>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color.replace('text', 'bg')}`} style={{ width: '70%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   2. ACTIONABLE SIDEBAR (SLIDE-OUT)
   Allows "Review team balance" without page navigation.
───────────────────────────────────────────────────────────────────────── */
export const ActionPanel = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />}
      
      {/* Slide-out */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-[#0A0A0A] border-l border-white/10 z-[70] transition-transform duration-500 ease-out p-8 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
};
