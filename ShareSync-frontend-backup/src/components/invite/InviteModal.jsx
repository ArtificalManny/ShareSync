// /src/components/modals/InviteModal.jsx
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Send } from 'lucide-react';
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

      // success toast
      toast({
        title: 'Invite sent',
        description: `Invitation sent to ${email}${projectId ? ` for project ${projectId}` : ''}.`,
        variant: 'success',
      });

      // Let parent mark row as "Invited"
      if (typeof onInvited === 'function') {
        onInvited({ email, projectId, inviteId: res?.inviteId });
      }

      // reset and close
      setEmail('');
      setRole('Member');
      setProjectId(defaultProjectId || '');
      setMessage('');
      onClose?.();
    } catch (err) {
      // error toast
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
        <Dialog.Panel className="bg-white dark:bg-charcoal-gray p-6 rounded-xl max-w-md w-full shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Invite Collaborator</Dialog.Title>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm focus:ring focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm"
              >
                <option value="Member">Member</option>
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID (optional)</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 64e4a..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message (optional)</label>
              <textarea
                className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm h-20"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note for the invite…"
              />
            </div>

            <button
              onClick={handleInvite}
              disabled={!email || submitting}
              className={`w-full inline-flex items-center justify-center gap-2 bg-emerald-green hover:bg-emerald-700 text-white py-2 px-4 rounded-md font-bold ${
                submitting ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <Send size={16} />
              {submitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default InviteModal;
