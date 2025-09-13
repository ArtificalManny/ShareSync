import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Send, Mail } from 'lucide-react';
import { sendInvite } from '../../api/invite';
import { toast } from '../ui/toast';

const InviteModal = ({ isOpen, onClose, defaultProjectId, inviterId, onInvited }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInvite = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await sendInvite({
        email,
        message,
        inviterId,
        projectId: projectId || undefined,
      });

      toast({
        title: 'Invite sent',
        description: `Invitation sent to ${email}${projectId ? ` for project ${projectId}` : ''}.`,
        variant: 'success',
      });

      if (typeof onInvited === 'function') {
        onInvited({ email, projectId, inviteId: res?.inviteId });
      }

      setEmail('');
      setRole('Member');
      setProjectId(defaultProjectId || '');
      setMessage('');
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to send invite';
      toast({
        title: 'Invite failed',
        description: msg,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black/50">
        <Dialog.Panel
          className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-[var(--shadow)] accent-bar shine"
        >
          <span className="accent-bar__left" aria-hidden="true" />
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="card-header inline-flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Invite Collaborator
            </Dialog.Title>
            <button
              onClick={onClose}
              className="btn btn--ghost"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-muted">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-surface"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-muted">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-surface"
              >
                <option value="Member">Member</option>
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted">Project ID (optional)</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-surface"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 64e4a..."
              />
            </div>

            <div>
              <label className="block text-sm text-muted">Message (optional)</label>
              <textarea
                className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-surface h-20"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note for the invite…"
              />
            </div>

            <button
              onClick={handleInvite}
              disabled={!email || submitting}
              className={`w-full btn btn--primary marching ${submitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default InviteModal;