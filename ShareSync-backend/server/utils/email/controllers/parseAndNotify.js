// server/utils/email/services/mentions/parseAndNotify.js
const events = require('../../system/events');
const telemetry = require('../telemetry.service');

/**
 * Very simple @mention parser:
 *  - Matches @username (letters, digits, underscore, dot)
 *  - Dedupes mentions
 *  - Looks up users by "username" (stub below) and emits notifications
 *
 * Replace `lookupUsersByHandles` with your real User model query:
 *    User.find({ username: { $in: handles } }, { _id: 1, username: 1 })
 */

const MENTION_RE = /@([A-Za-z0-9_.]{2,32})/g;

async function parseAndNotify({ projectId, authorId, postId, commentId, text }) {
  if (typeof text !== 'string') return { mentions: [] };

  const handles = dedupe(extractHandles(text));
  if (handles.length === 0) return { mentions: [] };

  const users = await lookupUsersByHandles(handles);
  const mentioned = users.map(u => ({ userId: String(u._id), username: u.username }));

  for (const m of mentioned) {
    // Telemetry + events; your notifications system can listen and send emails/sockets
    telemetry.track('mention', {
      projectId,
      authorId,
      postId,
      commentId: commentId || null,
      mentionedUserId: m.userId,
      username: m.username,
    });

    events.emit('mention', {
      type: 'mention',
      projectId,
      authorId,
      postId,
      commentId: commentId || null,
      mentionedUserId: m.userId,
      username: m.username,
    });
  }

  return { mentions: mentioned };
}

function extractHandles(text) {
  const out = [];
  let match;
  while ((match = MENTION_RE.exec(text)) !== null) {
    out.push(match[1]);
  }
  return out;
}

function dedupe(arr) {
  return Array.from(new Set(arr.map(String)));
}

// ---- STUB: replace with your real User lookup ----
async function lookupUsersByHandles(handles) {
  // Example if you have a User model:
  // const User = require('../../models/User');
  // return User.find({ username: { $in: handles } }, { _id: 1, username: 1 }).lean();

  // Temporary: pretend no users resolve (safe no-op)
  return [];
}

module.exports = {
  parseAndNotify,
  extractHandles, // exported for unit tests if you want
};
