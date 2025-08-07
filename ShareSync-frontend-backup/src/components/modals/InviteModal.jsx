import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Mail, X } from 'lucide-react';

const InviteModal = ({ isOpen, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [projectId, setProjectId] = useState('');

  const handleInvite = () => {
    onInvite({ email, role, projectId });
    setEmail('');
    setRole('Member');
    setProjectId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black bg-opacity-50">
        <Dialog.Panel className="bg-white dark:bg-charcoal-gray p-6 rounded-xl max-w-md w-full shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invite Collaborator</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500">
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm focus:ring focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID (optional)</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 rounded-md border shadow-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. 64e4a..."
            />
          </div>

          <button
            onClick={handleInvite}
            disabled={!email}
            className="w-full bg-emerald-green hover:bg-emerald-700 text-white py-2 px-4 rounded-md font-bold"
          >
            Send Invite
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default InviteModal;


//import to Home.jsx and ProjectOverview, look at TextEditor for exact code