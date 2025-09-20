import React, { useEffect, useId, useRef, useState } from 'react';

/**
 * Minimal a11y-friendly tooltip. Uses focus + hover; respects reduced motion.
 * Usage:
 *   <Tooltip label="Create (C)"> <button>New</button> </Tooltip>
 */
export default function Tooltip({ label, side = 'right', delay = 250, disabled = false, children }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const tRef = useRef(null);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => () => clearTimeout(tRef.current), []);

  if (!label || disabled) return children;

  const show = () => {
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(tRef.current);
    setOpen(false);
  };

  const pos =
    side === 'left'
      ? 'right-full mr-2 top-1/2 -translate-y-1/2'
      : side === 'bottom'
      ? 'top-full mt-2 left-1/2 -translate-x-1/2'
      : side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'left-full ml-2 top-1/2 -translate-y-1/2';

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {React.cloneElement(React.Children.only(children), {
        'aria-describedby': open ? id : undefined,
      })}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={[
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-[11px]',
            'bg-slate-900 text-white dark:bg-slate-800 shadow',
            prefersReduced ? '' : 'transition-opacity duration-150',
          ].join(' ')}
          style={{ opacity: open ? 1 : 0 }}
        >
          <span className="inline-block" />
          <span className={`absolute ${pos.replaceAll(' ', ' ')}`} aria-hidden="true" />
          {label}
        </span>
      )}
    </span>
  );
}
