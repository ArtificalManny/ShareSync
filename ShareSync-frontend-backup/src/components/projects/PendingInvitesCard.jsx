// src/components/projects/PendingInvitesCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.1 - Contrast Audit
// Muted the subtext/message to text-slate-500 so the project invite name 
// (text-slate-800) drives the hierarchy.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardBadge } from '../common/Card';
import Button from '../ui/Button.jsx';
import { toast } from '../ui/toast.jsx';
import { Mail } from 'lucide-react';

export default function PendingInvitesCard() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const email = useMemo(() => {
    if (window.__SS_USER?.email) return window.__SS_USER.email;
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
      toast({ title: 'Invite accepted!', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to accept invite', variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Card variant="ambient" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="ambient" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail strokeWidth={1.5} className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-800">Pending Invites</h3>
        </div>
        {invites.length > 0 && (
          <CardBadge variant="brand">{invites.length}</CardBadge>
        )}
      </div>

      {err && (
        <p className="text-xs font-medium text-red-500 mb-3">{err}</p>
      )}

      {!err && invites.length === 0 && (
        <p className="text-sm text-slate-500">No pending invites.</p>
      )}

      {invites.length > 0 && (
        <ul className="space-y-2.5">
          {invites.map((inv) => (
            <li 
              key={inv._id} 
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                  {inv.projectId ? `Project #${inv.projectId}` : 'Project invite'}
                </p>
                {inv.message && (
                  <p className="text-[13px] text-slate-500 truncate leading-snug mt-0.5">{inv.message}</p>
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
                  variant="ghost"
                  size="sm"
                >
                  Open
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
