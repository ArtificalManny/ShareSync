// src/components/ui/ContextMenu.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContextMenu } from '../../hooks/useContextMenu';

export default function ContextMenu() {
  const { isOpen, x, y, items, closeMenu, data } = useContextMenu();
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999, opacity: 0 });

  // Calculate safe coordinates immediately when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 12; // Distance from edge
      
      let newX = x;
      let newY = y;

      // Flip left if too close to right edge
      if (x + rect.width > window.innerWidth - padding) {
        newX = window.innerWidth - rect.width - padding;
      }
      
      // Flip up if too close to bottom edge
      if (y + rect.height > window.innerHeight - padding) {
        newY = y - rect.height; 
      }

      setPosition({ top: newY, left: newX, opacity: 1 });
    } else {
      setPosition({ top: -9999, left: -9999, opacity: 0 });
    }
  }, [isOpen, x, y]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          animate={{ opacity: position.opacity, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-[10000] min-w-[220px] py-1.5 rounded-xl bg-white/90 dark:bg-[#1f1f23]/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl overflow-hidden"
          style={{ 
            top: position.top, 
            left: position.left,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(139,92,246,0.05)'
          }}
          onClick={(e) => e.stopPropagation()} // Keep open if clicking inside the menu
          onContextMenu={(e) => e.preventDefault()} // Prevent browser menu inside our menu
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={`div-${idx}`} className="h-px bg-slate-200 dark:bg-white/5 my-1.5 mx-2" />;
            }
            
            const Icon = item.icon;
            
            return (
              <button
                key={item.id || idx}
                onClick={() => {
                  item.onClick?.(data);
                  closeMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors
                  ${item.destructive 
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-white/5 dark:hover:text-white'}
                `}
              >
                {Icon && <Icon className={`w-4 h-4 ${item.destructive ? '' : 'text-slate-400 group-hover:text-violet-500 dark:text-zinc-500'}`} />}
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
