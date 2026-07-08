// src/components/layout/MobileFloatingMessages.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function MobileFloatingMessages({
  unreadCount = 0,
  targetPath = '/messages',
  className = '',
}) {
  const navigate = useNavigate();

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  const handlePress = () => {
    try {
      const event = new CustomEvent('openshare:mobile-messages-press', {
        cancelable: true,
        detail: { targetPath },
      });

      window.dispatchEvent(event);

      if (event.defaultPrevented) return;
    } catch {}

    navigate(targetPath);
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={unreadCount > 0 ? `${unreadCount} unread messages` : 'Open messages'}
      title="Messages"
      className={`
        fixed right-5 bottom-[calc(10.25rem+env(safe-area-inset-bottom,0px))]
        z-[74] flex h-12 w-12 items-center justify-center md:hidden
        rounded-full border border-white/70
        bg-white/85 text-slate-700
        shadow-[0_18px_45px_rgba(15,23,42,0.18)]
        backdrop-blur-2xl transition active:scale-95
        dark:border-white/10 dark:bg-zinc-950/78 dark:text-white
        ${className}
      `}
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/95 via-white/75 to-violet-100/70 dark:from-white/12 dark:via-white/8 dark:to-violet-500/10" />

      <MessageCircle className="relative h-5.5 w-5.5 text-slate-700 dark:text-white" strokeWidth={2.35} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 px-1 text-[10px] font-black leading-none text-white shadow-lg shadow-fuchsia-500/30">
          {badgeText}
        </span>
      )}
    </button>
  );
}
