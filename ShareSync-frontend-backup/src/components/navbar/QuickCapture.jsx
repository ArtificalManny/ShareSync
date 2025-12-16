import React from 'react';
import { Plus } from 'lucide-react';

export default function QuickCapture() {
  return (
    <button className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30">
      <Plus className="w-3.5 h-3.5 text-purple-300" />
      <span className="text-xs font-medium text-purple-300">New</span>
    </button>
  );
}
