// server/utils/email/analytics/events.js
const events = require('../system/events');
const telemetry = require('../services/telemetry.service');
const notifications = require('../services/notifications/mentions'); // for mention emails/push
const EventEmitter = require('events');
const bus = new EventEmitter();

function wireAnalyticsEvents() {
  // Post created
  events.on('post_created', (e) => {
    telemetry.track('post_created', {
      projectId: String(e.projectId || ''),
      postId: String(e.postId || e.post?._id || e.post?.id || ''),
      authorId: String(e.authorId || ''),
    });
  });

  // Reaction toggled
  events.on('post_reaction_toggled', (e) => {
    telemetry.track('post_reacted', {
      projectId: String(e.projectId || ''),
      postId: String(e.postId || ''),
      userId: String(e.userId || ''),
      emoji: e.emoji,
      action: e.action, // 'added' | 'removed'
    });
  });

  // Comment created
  events.on('comment_created', (e) => {
    telemetry.track('post_commented', {
      projectId: String(e.projectId || ''),
      postId: String(e.postId || ''),
      commentId: String(e.commentId || ''),
      authorId: String(e.authorId || ''),
    });
  });

  // Mentions
  events.on('mention', async (e) => {
    telemetry.track('mention_sent', {
      projectId: String(e.projectId || ''),
      postId: e.postId ? String(e.postId) : null,
      commentId: e.commentId ? String(e.commentId) : null,
      authorId: String(e.authorId || ''),
      mentionedUserId: String(e.mentionedUserId || ''),
      username: e.username || null,
    });

    events.on('search_used', (e) => {
      telemetry.track('search_used', {
        userId: e.userId || null,
        q: e.q || '',
        types: e.types || [],
        count: e.count || 0,
      });
    });

    events.on('profile_discover_toggle', (e) => {
      telemetry.track('profile_discover_toggle', {
        usedId: e.userId,
        on: !!e.on,
      });
    });

    events.on('project_discover_toggle', (e) => {
      telemetry.track('project_discover_toggle', {
        userId: e.userId,
        projectId: e.projectId,
        on: !!e.on
      })
    })
    // Fire notifications (email/push) – non-blocking
    try {
      await notifications.notifyMention(e);
    } catch (err) {
      // swallow errors to not impact request path
      // console.error('[mentions] notify error', err);
    }
  });

  events.on('project_chat_toggle', (e) => {
    telemetry.track('project_chat_toggle', { userId: e.userId, projectId: e.projectId, on: !!e.on });
  });
}

module.exports = { wireAnalyticsEvents };
module.exports = bus;