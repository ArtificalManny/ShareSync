// src/components/notifications/Bell.jsx
// CLEANED: Replaced bg-surface and text-muted with glass theme Tailwind classes

import React, { useSyncExternalStore, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, clearUnread } from '../../state/notifications';

export default function BellMenu() {
  const store = useNotifications();
  const { items, unread } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        aria-label="Notifications"
        onClick={() => { setOpen((o) => !o); clearUnread(); }}
      >
        <Bell className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-xl z-20">
          <div className="p-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">Notifications</div>
          <ul className="max-h-64 overflow-auto">
            {items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-zinc-400">No notifications</li>
            ) : items.map(n => (
              <li key={n.id} className="px-3 py-2 text-sm border-t border-slate-100 dark:border-white/5 text-slate-800 dark:text-zinc-200 first:border-t-0">
                {n.text || 'Activity'}<div className="text-[11px] text-slate-400 dark:text-zinc-500">just now</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
