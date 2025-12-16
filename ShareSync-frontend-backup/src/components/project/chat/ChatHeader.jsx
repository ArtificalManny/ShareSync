// src/components/project/chat/ChatHeader.jsx
import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function ChatHeader({ projectName, messageCount = 0 }) {
  return (
    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-5 h-5 text-purple-400" />
        <h2 className="font-bold text-lg text-white">
          Project Chat {messageCount > 0 && `(${messageCount})`}
        </h2>
      </div>
      <p className="text-xs text-slate-400">
        Use for decisions & updates, not random noise.
      </p>
    </div>
  );
}
