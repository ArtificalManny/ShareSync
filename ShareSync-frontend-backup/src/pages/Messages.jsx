import React from 'react';
import MessageList from '../components/messaging/MessageList';
import MessageThread from '../components/messaging/MessageThread';
import MessageComposer from '../components/messaging/MessageComposer';

export default function Messages() {
  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 h-full">
        {/* Left: Conversation List */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
          <MessageList />
        </aside>

        {/* Right: Active Thread + Composer */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 h-full flex flex-col">
          <MessageThread />
          <MessageComposer />
        </section>
      </div>
    </div>
  );
}
