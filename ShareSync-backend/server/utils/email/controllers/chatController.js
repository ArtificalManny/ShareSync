// server/utils/email/controllers/chatController.js
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Project = require('../models/Project');
const events = require('../system/events');

function oid(v) { try { return new mongoose.Types.ObjectId(v); } catch { return null; } }

function isConvoMember(convo, userId) {
  if (!convo || !userId) return false;
  return (convo.memberIds || []).some(id => String(id) === String(userId));
}

async function isProjectMember(projectId, userId) {
  if (!projectId || !userId) return false;
  const proj = await Project.findById(projectId).select({ ownerId: 1, memberIds: 1, chatEnabled: 1 }).lean();
  if (!proj) return false;
  if (proj.chatEnabled === false) return false;
  if (String(proj.ownerId) === String(userId)) return true;
  return (proj.memberIds || []).some(id => String(id) === String(userId));
}

/** GET /conversations */
exports.listConversations = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const kind = req.query.kind === 'project' ? 'project' : (req.query.kind === 'dm' ? 'dm' : undefined);
    const projectId = req.query.projectId ? oid(req.query.projectId) : undefined;

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    if (!userId) return res.json({ page, limit, total: 0, items: [] });

    const q = { memberIds: userId };
    if (kind) q.kind = kind;
    if (kind === 'project' && projectId) q.projectId = projectId;

    const [items, total] = await Promise.all([
      Conversation.find(q).sort({ lastAt: -1 }).skip(skip).limit(limit).lean(),
      Conversation.countDocuments(q),
    ]);

    res.json({
      page, limit, total,
      items: items.map(c => ({
        id: String(c._id),
        kind: c.kind,
        memberIds: (c.memberIds || []).map(String),
        projectId: c.projectId ? String(c.projectId) : null,
        lastAt: c.lastAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) { next(err); }
};

/** POST /conversations  { kind:'dm'|'project', memberIds?, projectId? } */
exports.createConversation = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Auth required' });

    const { kind, memberIds = [], projectId } = req.body || {};
    if (!kind || !['dm', 'project'].includes(kind)) {
      return res.status(400).json({ error: "kind must be 'dm' or 'project'" });
    }

    if (kind === 'dm') {
      const set = new Set((Array.isArray(memberIds) ? memberIds : []).map(String));
      set.add(String(userId));
      const members = Array.from(set).map(oid).filter(Boolean);
      if (members.length < 2) return res.status(400).json({ error: 'DM requires at least 2 members' });

      const existing = await Conversation.findOne({ kind: 'dm', memberIds: { $all: members, $size: members.length } });
      if (existing) {
        return res.status(200).json({
          id: String(existing._id),
          kind: existing.kind,
          memberIds: (existing.memberIds || []).map(String),
          projectId: existing.projectId ? String(existing.projectId) : null,
          lastAt: existing.lastAt,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        });
      }
      const convo = await Conversation.create({ kind: 'dm', memberIds: members, lastAt: new Date() });
      events.emit('chat_conversation_created', { convoId: String(convo._id), kind: 'dm', memberIds: members.map(String) });
      return res.status(201).json({
        id: String(convo._id),
        kind: convo.kind,
        memberIds: (convo.memberIds || []).map(String),
        projectId: null,
        lastAt: convo.lastAt,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
      });
    }

    const pid = oid(projectId);
    if (!pid) return res.status(400).json({ error: 'projectId required' });
    const ok = await isProjectMember(pid, userId);
    if (!ok) return res.status(403).json({ error: 'Not a project member or chat disabled' });

    const convo = await Conversation.create({ kind: 'project', projectId: pid, memberIds: [userId], lastAt: new Date() });
    events.emit('chat_conversation_created', {
      convoId: String(convo._id),
      kind: 'project',
      projectId: String(pid),
      memberIds: [String(userId)],
    });

    res.status(201).json({
      id: String(convo._id),
      kind: convo.kind,
      memberIds: (convo.memberIds || []).map(String),
      projectId: convo.projectId ? String(convo.projectId) : null,
      lastAt: convo.lastAt,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    });
  } catch (err) { next(err); }
};

/** GET /conversations/:id/messages?cursor|page&limit= */
exports.listMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const convoId = oid(req.params.id);
    if (!convoId) return res.status(400).json({ error: 'Invalid conversation id' });

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!isConvoMember(convo, userId)) return res.status(403).json({ error: 'Forbidden' });

    const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 200);

    if (req.query.cursor) {
      const before = new Date(req.query.cursor);
      const items = await Message.find({ convoId, createdAt: { $lt: before } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return res.json({
        cursor: req.query.cursor,
        items: items.map(serMsg).reverse(),
        nextCursor: items.length ? items[0].createdAt.toISOString() : null,
      });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Message.find({ convoId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments({ convoId }),
    ]);

    res.json({ page, limit, total, items: items.map(serMsg).reverse() });
  } catch (err) { next(err); }
};

/** POST /conversations/:id/messages  { text, attachments? } */
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Auth required' });

    const convoId = oid(req.params.id);
    if (!convoId) return res.status(400).json({ error: 'Invalid conversation id' });

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!isConvoMember(convo, userId)) return res.status(403).json({ error: 'Forbidden' });

    const { text = '', attachments = [] } = req.body || {};
    if (!String(text || '').trim() && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const msg = await Message.create({
      convoId,
      authorId: userId,
      text: String(text || '').trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    convo.lastAt = msg.createdAt;
    await convo.save();

    const outMsg = serMsg(msg);
    events.emit('chat_message_created', {
      convoId: String(convoId),
      projectId: convo.projectId ? String(convo.projectId) : null,
      memberIds: (convo.memberIds || []).map(String),
      message: outMsg,
    });

    res.status(201).json(outMsg);
  } catch (err) { next(err); }
};

/** POST /conversations/:id/messages/:msgId/reactions  { emoji } (toggle) */
exports.toggleReaction = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Auth required' });

    const convoId = oid(req.params.id);
    const msgId = oid(req.params.msgId);
    const emoji = String((req.body && req.body.emoji) || '').trim();
    if (!convoId || !msgId || !emoji) return res.status(400).json({ error: 'invalid input' });

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!isConvoMember(convo, userId)) return res.status(403).json({ error: 'Forbidden' });

    const msg = await Message.findOne({ _id: msgId, convoId });
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const key = emoji;
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

    const out = serMsg(msg);
    events.emit('chat_message_updated', {
      convoId: String(convoId),
      projectId: convo.projectId ? String(convo.projectId) : null,
      memberIds: (convo.memberIds || []).map(String),
      message: { id: out.id, convoId: out.convoId }, // lightweight; clients may refetch
    });

    // Optional specialized event
    events.emit('chat_reaction_toggled', {
      convoId: String(convoId),
      messageId: String(msgId),
      emoji,
      userId: String(userId),
      op,
    });

    res.json(out);
  } catch (err) { next(err); }
};

/** POST /conversations/:id/read  { at?: ISO }  (in-memory watermark MVP) */
const readMarks = new Map(); // key `${convoId}:${userId}` -> Date
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Auth required' });

    const convoId = oid(req.params.id);
    if (!convoId) return res.status(400).json({ error: 'Invalid conversation id' });

    const at = req.body?.at ? new Date(req.body.at) : new Date();
    readMarks.set(`${String(convoId)}:${String(userId)}`, at);

    events.emit('chat_read', { convoId: String(convoId), userId: String(userId), at: at.toISOString() });
    res.json({ ok: true, at: at.toISOString() });
  } catch (err) { next(err); }
};

/** Utility: compute unread count from watermark (MVP, per request) */
exports.getUnreadCount = async (convoId, userId) => {
  const key = `${String(convoId)}:${String(userId)}`;
  const since = readMarks.get(key);
  if (!since) return Message.countDocuments({ convoId });
  return Message.countDocuments({ convoId, createdAt: { $gt: since } });
};

function serMsg(m) {
  const base = m.toObject ? m.toObject() : m;
  return {
    id: String(base._id),
    convoId: String(base.convoId),
    authorId: String(base.authorId),
    text: base.text || '',
    attachments: base.attachments || [],
    reactions: mapToObj(base.reactions),
    createdAt: base.createdAt,
  };
}
function mapToObj(map) {
  if (!map) return undefined;
  const out = {};
  for (const [k, v] of map.entries()) out[k] = v.map(String);
  return out;
}
