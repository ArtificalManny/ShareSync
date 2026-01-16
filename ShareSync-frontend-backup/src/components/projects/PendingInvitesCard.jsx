// src/components/projects/PendingInvitesCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each invite: 1) Project name  2) Message (optional)  3) Accept/Open actions
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

  // Loading State
  if (loading) {
    return (
      <Card variant="ambient" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-28 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-10 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-10 bg-surface-2 rounded-lg animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="ambient" padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-medium text-text-primary">Pending Invites</h3>
        </div>
        {invites.length > 0 && (
          <CardBadge variant="brand">{invites.length}</CardBadge>
        )}
      </div>

      {/* Error */}
      {err && (
        <p className="text-xs text-danger mb-2">{err}</p>
      )}

      {/* Empty State */}
      {!err && invites.length === 0 && (
        <p className="text-xs text-text-tertiary">No pending invites.</p>
      )}

      {/* Invite List */}
      {invites.length > 0 && (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <li 
              key={inv._id} 
              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary truncate">
                  {inv.projectId ? `Project #${inv.projectId}` : 'Project invite'}
                </p>
                {inv.message && (
                  <p className="text-xs text-text-tertiary truncate">{inv.message}</p>
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
    </Card>
  );
}
