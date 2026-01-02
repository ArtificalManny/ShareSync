import { toast } from "../ui/Toast";
// src/components/projects/PendingInvitesCard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Button from "../ui/Button.jsx";


export default function PendingInvitesCard() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Try to read the signed-in user email (adjust if your app stores it elsewhere)
  const email = useMemo(() => {
    // Prefer a global your app may set (tweak as needed)
    if (window.__SS_USER?.email) return window.__SS_USER.email;
    // Fallbacks: localStorage keys your app might use
    const stored = localStorage.getItem('ss_user_email') || localStorage.getItem('email');
    return stored || '';
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        const qs = email ? `?email=${encodeURIComponent(email)}` : '';
        const res = await fetch(`/api/invites/pending${qs}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setInvites(Array.isArray(data?.invites) ? data.invites : []);
      } catch (e) {
        if (!ignore) setErr('Failed to load invites');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [email]);

  const accept = async (token) => {
    try {
      const res = await fetch(`/api/invites/accept/${token}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInvites(prev => prev.filter(i => i.token !== token));
    } catch (e) {
      toast.error('Failed to accept invite', { description: 'Please try again', duration: 3000 });
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending Invites</h3>
        {!loading && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{invites.length}</span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 rounded-lg animate-pulse bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
      ) : err ? (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{err}</p>
      ) : invites.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No pending invites.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {invites.map((inv) => (
            <li key={inv._id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-800 dark:text-slate-100 truncate">
                  {inv.projectId ? `Project #${inv.projectId}` : 'Project invite'}
                </div>
                {inv.message && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{inv.message}</div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => accept(inv.token)}
                >
                  Accept
                </Button>
                <Button
                  as="a"
                  href={`${window.location.origin}/invite/${inv.token}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                  size="sm"
                >
                  Open
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
