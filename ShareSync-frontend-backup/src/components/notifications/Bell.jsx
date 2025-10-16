// src/components/notifications/Bell.jsx
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
        className="relative rounded-lg p-2 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Notifications"
        onClick={() => { setOpen((o) => !o); clearUnread(); }}
      >
        <Bell className="w-5 h-5 text-muted" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-surface shadow-xl z-20">
          <div className="p-2 text-xs font-semibold text-muted">Notifications</div>
          <ul className="max-h-64 overflow-auto">
            {items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No notifications</li>
            ) : items.map(n => (
              <li key={n.id} className="px-3 py-2 text-sm border-t border-border/70 first:border-t-0">
                {n.text || 'Activity'}<div className="text-[11px] text-muted">just now</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
