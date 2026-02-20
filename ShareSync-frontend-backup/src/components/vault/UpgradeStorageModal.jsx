import React from 'react';
import { X, HardDrive, Zap, CheckCircle2 } from 'lucide-react';

export default function UpgradeStorageModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#18181b] border border-brand-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(124,58,237,0.3)] w-full max-w-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-cyan-500" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary"><X className="w-5 h-5" /></button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
            <HardDrive className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Storage Limit Reached</h2>
          <p className="text-sm text-text-tertiary mb-8">
            Your project has hit its 5GB free tier limit. Upgrade your workspace to unlock massive storage for your whole team.
          </p>

          <div className="bg-surface-2 rounded-xl p-4 text-left space-y-3 mb-8 border border-white/[0.04]">
            <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success-400" /><span className="text-sm text-text-secondary">100 GB Shared Storage</span></div>
            <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success-400" /><span className="text-sm text-text-secondary">Unlimited Private Folders</span></div>
            <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success-400" /><span className="text-sm text-text-secondary">Max file size bumped to 5GB</span></div>
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white font-medium rounded-xl hover:from-brand-400 hover:to-purple-500 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Upgrade Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
