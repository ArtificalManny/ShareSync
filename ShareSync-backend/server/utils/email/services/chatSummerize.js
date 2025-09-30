// server/utils/email/services/chatSummarizer.js
const Message = require('../models/Message');

/**
 * Summarize recent N messages and (optionally) persist a system message.
 * Replace the implementation with your LLM when ready.
 */
async function summarizeConversation(convoId, { limit = 50, persist = false } = {}) {
  const items = await Message.find({ convoId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const text = items
    .slice()
    .reverse()
    .map(m => `${m.authorId}: ${m.text || ''}`.trim())
    .filter(Boolean)
    .join('\n');

  const summary = (text.length > 0)
    ? `Summary of last ${items.length} messages:\n` + text.slice(0, 2000)
    : 'No content to summarize.';

  if (persist) {
    await Message.create({
      convoId,
      authorId: null, // system
      text: `[system summary]\n${summary}`,
      attachments: [],
    });
  }
  return { summary, count: items.length };
}

module.exports = { summarizeConversation };
