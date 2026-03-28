// src/components/ui/CustomCursor.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: Signature - Tactile Custom Cursor
// Creates a fluid, physics-based cursor ring that reacts to data-cursor attributes
// on interactive elements, making the app feel like a physical tool.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [cursorType, setCursorType] = useState('default'); // 'default', 'ship', 'drag'
  const [hidden, setHidden] = useState(true);
  
  const requestRef = useRef();
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only enable on desktop/pointer devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    const onMouseMove = (e) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (hidden) setHidden(false);

      const target = e.target;
      const isClickable = window.getComputedStyle(target).cursor === 'pointer' || target.closest('button, a, [role="button"]');
      setIsPointer(isClickable);

      // Check for specific interactive tags
      const cursorState = target.closest('[data-cursor]');
      if (cursorState) {
        setCursorType(cursorState.getAttribute('data-cursor'));
      } else {
        setCursorType('default');
      }
    };

    const onMouseLeave = () => setHidden(true);
    const onMouseEnter = () => setHidden(false);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Spring physics animation loop
    const updateCursor = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.25;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.25;
      
      setPosition({ x: currentPos.current.x, y: currentPos.current.y });
      requestRef.current = requestAnimationFrame(updateCursor);
    };
    requestRef.current = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(requestRef.current);
    };
  }, [hidden]);

  if (hidden) return null;

  // Determine styles based on context
  let ringSize = 32;
  let ringClass = "border-slate-300 dark:border-white/20 bg-transparent";
  let content = null;

  if (cursorType === 'ship') {
    ringSize = 48;
    ringClass = "border-transparent bg-[var(--theme-accent-primary)] mix-blend-multiply dark:mix-blend-screen scale-110";
    content = <span className="text-[10px] font-black text-white absolute">SHIP</span>;
  } else if (cursorType === 'drag') {
    ringSize = 24;
    ringClass = "border-[var(--theme-accent-primary)] bg-[var(--theme-accent-glow)]";
  } else if (isPointer) {
    ringSize = 16;
    ringClass = "border-[var(--theme-accent-primary)] bg-[var(--theme-accent-primary)] opacity-50";
  }

  return (
    <div 
      className="fixed top-0 left-0 pointer-events-none z-[99999] flex items-center justify-center transition-all duration-300 ease-out"
      style={{
        transform: `translate3d(${position.x - ringSize/2}px, ${position.y - ringSize/2}px, 0)`,
        width: ringSize,
        height: ringSize,
      }}
    >
      <div className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all duration-200 ${ringClass}`}>
        {content}
      </div>
    </div>
  );
}
