// server/utils/email/sockets/chat.js
const mongoose = require('mongoose');
const events = require('../system/events');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const authRequired = require('../middleware/auth');
const { sendMessageLimiter } = require('../middleware/rateLimit');
const chat = require('../controllers/chatController');

function oid(v) { try { return new mongoose.Types.ObjectId(v); } catch { return null; } }

async function isProjectMember(projectId, userId) {
  if (!projectId || !userId) return false;
  const proj = await Project.findById(projectId).select({ ownerId: 1, memberIds: 1, chatEnabled: 1 }).lean();
  if (!proj) return false;
  if (proj.chatEnabled === false) return false; // gate project chat
  if (String(proj.ownerId) === String(userId)) return true;
  return (proj.memberIds || []).some(id => String(id) === String(userId));
}

function isConvoMemberSync(convo, userId) {
  return (convo?.memberIds || []).some(id => String(id) === String(userId));
}

function wireChatSockets(io) {
  if (!io) return;

  io.on('connection', (socket) => {
    // Expect auth middleware to set socket.data.userId
    const userId = socket?.data?.userId || socket?.handshake?.auth?.userId || null;
    if (!userId) {
      // unauthenticated sockets aren’t allowed for chat
      try { socket.disconnect(true); } catch {}
      return;
    }

    // Join personal room for DM notifications
    socket.join(`user:${userId}`);

    // Presence
    io.to(`user:${userId}`).emit('chat:presence', { userId: String(userId), state: 'online' });
    socket.on('disconnect', () => {
      io.to(`user:${userId}`).emit('chat:presence', { userId: String(userId), state: 'offline' });
    });

    // ---- Client -> Server events ----

    // Join a project chat room
    socket.on('chat:join', async (payload = {}, ack) => {
      try {
        const { projectId, convoId } = payload;
        if (projectId) {
          const ok = await isProjectMember(projectId, userId);
          if (!ok) return ack?.({ ok: false, error: 'forbidden' });
          socket.join(`project:${projectId}:chat`);
          return ack?.({ ok: true });
        }
        if (convoId) {
          const convo = await Conversation.findById(convoId).lean();
          if (!convo || !isConvoMemberSync(convo, userId)) return ack?.({ ok: false, error: 'forbidden' });
          socket.join(`convo:${convoId}`);
          return ack?.({ ok: true });
        }
        return ack?.({ ok: false, error: 'missing target' });
      } catch (e) {
        return ack?.({ ok: false, error: 'error' });
      }
    });

    socket.on('chat:leave', (payload = {}, ack) => {
      const { projectId, convoId } = payload;
      if (projectId) socket.leave(`project:${projectId}:chat`);
      if (convoId) socket.leave(`convo:${convoId}`);
      ack?.({ ok: true });
    });

    // Typing indicator (project or convo)
    socket.on('chat:typing', async (payload = {}) => {
      const { projectId, convoId, isTyping = true } = payload;
      if (projectId) {
        const ok = await isProjectMember(projectId, userId);
        if (!ok) return;
        io.to(`project:${projectId}:chat`).emit('chat:typing', {
          userId: String(userId), projectId: String(projectId), isTyping: !!isTyping,
        });
      } else if (convoId) {
        const convo = await Conversation.findById(convoId).lean();
        if (!convo || !isConvoMemberSync(convo, userId)) return;
        io.to(`convo:${convoId}`).emit('chat:typing', {
          userId: String(userId), convoId: String(convoId), isTyping: !!isTyping,
        });
      }
    });

    // Send message directly via socket (optional shortcut)
    socket.on('chat:send', async (payload = {}, ack) => {
      try {
        const { convoId, text = '', attachments = [] } = payload;
        const cid = oid(convoId);
        if (!cid) return ack?.({ ok: false, error: 'invalid_conversation' });

        const convo = await Conversation.findById(cid);
        if (!convo || !isConvoMemberSync(convo, userId)) return ack?.({ ok: false, error: 'forbidden' });

        if (!String(text || '').trim() && (!Array.isArray(attachments) || attachments.length === 0)) {
          return ack?.({ ok: false, error: 'empty_message' });
        }

        const msg = await Message.create({
          convoId: cid,
          authorId: userId,
          text: String(text || '').trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
        });

        convo.lastAt = msg.createdAt;
        await convo.save();

        const payloadOut = {
          convoId: String(convo._id),
          message: {
            id: String(msg._id),
            convoId: String(msg.convoId),
            authorId: String(msg.authorId),
            text: msg.text,
            attachments: msg.attachments || [],
            reactions: undefined,
            createdAt: msg.createdAt,
          },
        };

        // broadcast to rooms (per-convo and project chat if applicable)
        io.to(`convo:${convoId}`).emit('chat:message', payloadOut);
        if (convo.projectId) io.to(`project:${String(convo.projectId)}:chat`).emit('chat:message', payloadOut);

        // and to personal DM rooms
        (convo.memberIds || []).forEach(uid => io.to(`user:${String(uid)}`).emit('chat:message', payloadOut));

        // also emit on the events bus (so your existing bridges/analytics work)
        events.emit('chat_message_created', {
          convoId: String(convo._id),
          projectId: convo.projectId ? String(convo.projectId) : null,
          memberIds: (convo.memberIds || []).map(String),
          message: payloadOut.message,
        });

        return ack?.({ ok: true, message: payloadOut.message });
      } catch (e) {
        return ack?.({ ok: false, error: 'error' });
      }
    });

    // React to a message (toggle)
    socket.on('chat:react', async (payload = {}) => {
      const { convoId, messageId, emoji } = payload;
      const cid = oid(convoId);
      const mid = oid(messageId);
      if (!cid || !mid || !emoji) return;

      const convo = await Conversation.findById(cid);
      if (!convo || !isConvoMemberSync(convo, userId)) return;

      const msg = await Message.findOne({ _id: mid, convoId: cid });
      if (!msg) return;

      const key = String(emoji);
      const arr = (msg.reactions?.get(key)) || [];
      const exists = arr.some(id => String(id) === String(userId));
      let op = 'add';

      if (exists) {
        const next = arr.filter(id => String(id) !== String(userId));
        if (next.length) {
          if (!msg.reactions) msg.reactions = new Map();
          msg.reactions.set(key, next);
        } else {
          msg.reactions?.delete?.(key);
          if (msg.reactions && msg.reactions.size === 0) msg.reactions = undefined;
        }
        op = 'remove';
      } else {
        if (!msg.reactions) msg.reactions = new Map();
        msg.reactions.set(key, [...arr, userId]);
      }

      await msg.save();

      const out = { convoId: String(cid), messageId: String(mid), emoji: key, userId: String(userId), op };
      io.to(`convo:${String(cid)}`).emit('chat:reaction', out);
      if (convo.projectId) io.to(`project:${String(convo.projectId)}:chat`).emit('chat:reaction', out);
      (convo.memberIds || []).forEach(uid => io.to(`user:${String(uid)}`).emit('chat:reaction', out));

      events.emit('chat_message_updated', {
        convoId: String(cid),
        projectId: convo.projectId ? String(convo.projectId) : null,
        memberIds: (convo.memberIds || []).map(String),
        message: {
          id: String(msg._id),
          convoId: String(msg.convoId),
          // client will refetch if it needs full state
        },
      });
    });
  });

  // If you already emit on the events bus from REST, forward them to sockets here too:
  events.on('chat_message_created', (e) => {
    if (!e?.message) return;
    io.to(`convo:${e.convoId}`).emit('chat:message', { convoId: e.convoId, message: e.message });
    if (e.projectId) io.to(`project:${e.projectId}:chat`).emit('chat:message', { convoId: e.convoId, message: e.message });
    (e.memberIds || []).forEach(uid => io.to(`user:${uid}`).emit('chat:message', { convoId: e.convoId, message: e.message }));
  });

  events.on('chat_message_updated', (e) => {
    io.to(`convo:${e.convoId}`).emit('chat:message:update', e);
    if (e.projectId) io.to(`project:${e.projectId}:chat`).emit('chat:message:update', e);
    (e.memberIds || []).forEach(uid => io.to(`user:${uid}`).emit('chat:message:update', e));
  });
}

module.exports = { wireChatSockets };
