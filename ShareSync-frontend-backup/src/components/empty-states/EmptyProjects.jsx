// src/components/empty-states/EmptyProjects.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4.1: Empty States That Sell - Empty Projects
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Plus, Download } from 'lucide-react';
import { OPENSHARE_MESSAGING } from '../../content/openShareMessaging';

export default function EmptyProjects({ onCreateProject, onImport }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center h-full w-full max-w-2xl mx-auto"
    >
      <div className="relative mb-8">
        {/* Glow behind the icon */}
        <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full scale-150" />
        <div className="relative w-24 h-24 rounded-3xl bg-surface-2 border border-white/[0.08] shadow-2xl flex items-center justify-center">
          <Rocket className="w-12 h-12 text-brand-400" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-text-primary mb-3">Ready for liftoff?</h2>
      <p className="text-text-secondary text-lg mb-10 max-w-md">
        {OPENSHARE_MESSAGING.compact}
      </p>
      
      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={onCreateProject}
          className="btn-primary flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
        
        <button 
          onClick={onImport}
          className="text-sm font-medium text-text-tertiary hover:text-brand-400 transition-colors flex items-center gap-2 group"
        >
          <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          Import from Asana/Trello
        </button>
      </div>
    </motion.div>
  );
}
