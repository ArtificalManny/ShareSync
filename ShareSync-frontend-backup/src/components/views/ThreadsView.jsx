// src/components/views/ThreadsView.jsx
// Split-panel Threads with Messenger-style member picker
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Pin, Search, Plus, Clock, Users,
  Hash, Loader2, X, ChevronLeft, ArrowUp, Check,
} from 'lucide-react';
import {
  getProjectThreads, createThread,
  getThreadMessages, postThreadMessage,
} from '../../api/threads';
import { toast } from '../ui/toast';

const CHANNELS = [
  { id: 'all', label: 'All', icon: MessageCircle },
  { id: 'planning', label: 'Planning', icon: Hash },
  { id: 'design', label: 'Design', icon: Hash },
  { id: 'ops', label: 'Ops', icon: Hash },
  { id: 'general', label: 'General', icon: Hash },
];

function timeAgo(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (isNaN(d) || d < 0) return '';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 1) return 'Now';
  if (m < 60) return m + 'm';
  if (h < 24) return h + 'h';
  if (dy < 7) return dy + 'd';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractMembers(project) {
  if (!project) return [];
  const members = [];
  const seen = new Set();
  const ownerId = project.ownerId?._id || project.ownerId || project.owner?._id;
  if (ownerId && !seen.has(ownerId)) {
    seen.add(ownerId);
    const owner = project.owner || {};
    members.push({ id: ownerId, name: owner.firstName ? (owner.firstName + ' ' + (owner.lastName || '')).trim() : (owner.username || 'Owner'), role: 'owner' });
  }
  if (Array.isArray(project.members)) {
    for (const m of project.members) {
      const user = m.userId || m;
      const uid = user?._id || user?.id || (typeof user === 'string' ? user : null);
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      members.push({ id: uid, name: user.firstName ? (user.firstName + ' ' + (user.lastName || '')).trim() : (user.username || uid.slice(-6)), role: m.role || 'member' });
    }
  }
  return members;
}

function ThreadItem({ thread, isActive, onClick }) {
  return (
    <button onClick={() => onClick(thread)}
      className={'w-full text-left p-3 rounded-xl transition-all duration-150 ' + (isActive ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20' : 'bg-white dark:bg-white/[0.03] border border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.05]')}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {thread.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 fill-current" />}
          <span className={'text-sm font-medium truncate ' + (isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-white')}>{thread.title}</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-white/30 flex-shrink-0">{timeAgo(thread.lastReplyAt || thread.createdAt)}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-white/40 truncate mb-1.5">{thread.lastMessage || 'No messages yet'}</p>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-white/30">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{thread.participantCount || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.replyCount || 0}</span>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isOwn }) {
  const name = msg.userId?.firstName ? (msg.userId.firstName + ' ' + (msg.userId.lastName || '')).trim() : (msg.authorName || 'Team Member');
  const initial = name[0]?.toUpperCase() || '?';
  return (
    <div className={'flex gap-2.5 ' + (isOwn ? 'flex-row-reverse' : '')}>
      <div className={'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ' + (isOwn ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-white/50')}>{initial}</div>
      <div className={'max-w-[75%] ' + (isOwn ? 'text-right' : '')}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-medium text-slate-700 dark:text-white/70">{name}</span>
          <span className="text-[10px] text-slate-400 dark:text-white/30">{timeAgo(msg.createdAt)}</span>
        </div>
        <div className={'inline-block px-3 py-2 rounded-xl text-sm leading-relaxed ' + (isOwn ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-white/80 rounded-tl-sm')}>{msg.content || ''}</div>
      </div>
    </div>
  );
}

function ConversationPanel({ thread, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const threadId = thread?._id || thread?.id;

  useEffect(() => {
    if (!threadId) return;
    let mounted = true;
    setLoading(true);
    getThreadMessages(threadId).then(data => { if (mounted) setMessages(Array.isArray(data) ? data : []); }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [threadId]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = useCallback(async () => {
    const content = newMsg.trim();
    if (!content || !threadId || sending) return;
    const optimistic = { _id: 'temp-' + Date.now(), content, authorName: 'You', createdAt: new Date().toISOString(), _isOwn: true };
    setMessages(prev => [...prev, optimistic]);
    setNewMsg('');
    setSending(true);
    try {
      const created = await postThreadMessage(threadId, content);
      if (created) setMessages(prev => prev.map(m => m._id === optimistic._id ? { ...created, _isOwn: true } : m));
    } catch { setMessages(prev => prev.filter(m => m._id !== optimistic._id)); toast({ title: 'Failed to send', variant: 'error' }); }
    finally { setSending(false); }
  }, [newMsg, threadId, sending]);

  if (!thread) return null;
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] lg:hidden"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{thread.title}</h3>
          <p className="text-[11px] text-slate-400 dark:text-white/30">{thread.participantCount || thread.participants?.length || 0} members</p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (<div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading...</span></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12"><div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-3"><MessageCircle className="w-6 h-6 text-violet-500" /></div><p className="text-sm font-medium text-slate-600 dark:text-white/60 mb-1">Start the conversation</p><p className="text-xs text-slate-400 dark:text-white/30">Send a message to get things going</p></div>
        ) : messages.map((msg, idx) => {
          const msgUserId = msg.userId?._id || msg.userId;
          const isOwn = msg._isOwn || (currentUserId && msgUserId === currentUserId);
          return <MessageBubble key={msg._id || idx} msg={msg} isOwn={isOwn} />;
        })}
      </div>
      <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message..." maxLength={5000}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          <button onClick={handleSend} disabled={sending || !newMsg.trim()} className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 shadow-sm">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateThreadModal({ projectId, members, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    return members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
  }, [members, memberSearch]);

  const toggleMember = (member) => {
    setSelectedMembers(prev => prev.find(m => m.id === member.id) ? prev.filter(m => m.id !== member.id) : [...prev, member]);
  };

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const created = await createThread({ projectId, title: title.trim(), category });
      onCreated?.(created);
      onClose();
      toast({ title: 'Thread created', variant: 'success' });
    } catch (err) { toast({ title: err?.message || 'Failed', variant: 'error' }); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">New Conversation</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">To</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5 p-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.05]">
              {selectedMembers.map(m => (
                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  {m.name}<button onClick={() => toggleMember(m)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                placeholder={selectedMembers.length === 0 ? 'Search members...' : ''}
                className="flex-1 min-w-[100px] text-sm bg-transparent text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none" />
            </div>
            {members.length > 0 && (
              <div className="mt-2 max-h-[160px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1f1f23]">
                {filteredMembers.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">No members found</p>
                ) : filteredMembers.map(m => {
                  const sel = selectedMembers.some(s => s.id === m.id);
                  return (
                    <button key={m.id} onClick={() => toggleMember(m)}
                      className={'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ' + (sel ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]')}>
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[11px] font-medium text-slate-600 dark:text-white/50">{m.name[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.name}</p><p className="text-[10px] text-slate-400 capitalize">{m.role}</p></div>
                      {sel && <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Thread Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning..." maxLength={100}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Channel</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['general', 'planning', 'design', 'ops'].map(ch => (
                <button key={ch} onClick={() => setCategory(ch)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ' + (category === ch ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' : 'bg-white dark:bg-white/[0.03] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.08]')}>{ch}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60">Cancel</button>
            <button onClick={handleCreate} disabled={!title.trim() || creating}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 shadow-sm">
              {creating ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThreadsView({ projectId, project, onOpenFullChat }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const projectMembers = useMemo(() => extractMembers(project), [project]);
  const currentUserId = useMemo(() => {
    try { const s = localStorage.getItem('user') || localStorage.getItem('auth_user'); if (s) { const u = JSON.parse(s); return u?.id || u?._id; } } catch {} return null;
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    setLoading(true);
    getProjectThreads(projectId).then(data => {
      if (!mounted) return;
      setThreads((Array.isArray(data) ? data : []).map(t => ({ ...t, id: t._id || t.id, title: t.title || 'Untitled', lastMessage: t.replyCount > 0 ? 'Recent activity' : 'No messages yet', participantCount: t.participants?.length || 0, replyCount: t.replyCount || 0, category: t.category || 'general' })));
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [projectId]);

  const filtered = useMemo(() => threads.filter(t => {
    if (activeChannel !== 'all' && t.category !== activeChannel) return false;
    if (searchQuery) return t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  }), [threads, activeChannel, searchQuery]);

  const pinnedThreads = filtered.filter(t => t.isPinned);
  const regularThreads = filtered.filter(t => !t.isPinned);

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden mx-10 my-6">
      <div className={'w-80 flex-shrink-0 border-r border-slate-100 dark:border-white/[0.06] flex flex-col ' + (activeThread ? 'hidden lg:flex' : 'flex')}>
        <div className="px-4 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">Threads</h2>
            <button onClick={() => setShowCreate(true)} className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-sm"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search threads..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          </div>
        </div>
        <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] flex gap-1 overflow-x-auto">
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)} className={'px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ' + (activeChannel === ch.id ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.04]')}>{ch.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          : filtered.length === 0 ? <div className="text-center py-12"><MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs text-slate-400">No threads found</p></div>
          : <>
            {pinnedThreads.length > 0 && <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-amber-600"><Pin className="w-3 h-3 fill-current" /> Pinned</div>}
            {pinnedThreads.map(t => <ThreadItem key={t.id} thread={t} isActive={(activeThread?._id || activeThread?.id) === (t._id || t.id)} onClick={setActiveThread} />)}
            {pinnedThreads.length > 0 && regularThreads.length > 0 && <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-slate-400 mt-2"><Clock className="w-3 h-3" /> Recent</div>}
            {regularThreads.map(t => <ThreadItem key={t.id} thread={t} isActive={(activeThread?._id || activeThread?.id) === (t._id || t.id)} onClick={setActiveThread} />)}
          </>}
        </div>
      </div>

      <div className={'flex-1 flex flex-col ' + (!activeThread ? 'hidden lg:flex' : 'flex')}>
        {activeThread ? <ConversationPanel thread={activeThread} currentUserId={currentUserId} onBack={() => setActiveThread(null)} />
        : <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-8 h-8 text-violet-500" /></div><h3 className="text-lg font-semibold text-slate-700 dark:text-white/70 mb-1">Select a thread</h3><p className="text-sm text-slate-400">Choose a conversation or start a new one</p></div></div>}
      </div>

      {showCreate && <CreateThreadModal projectId={projectId} members={projectMembers} onClose={() => setShowCreate(false)} onCreated={(t) => { setThreads(prev => [{ ...t, id: t._id || t.id, category: t.category || 'general', participantCount: 0, replyCount: 0, lastMessage: 'No messages yet' }, ...prev]); setActiveThread(t); }} />}
    </div>
  );
}
