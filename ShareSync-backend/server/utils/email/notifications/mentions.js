// server/utils/email/services/notifications/mentions.js

/**
 * Notify a user they were mentioned.
 * Event shape (from events 'mention'):
 * {
 *   projectId, authorId, postId?, commentId?, mentionedUserId, username
 * }
 */
async function notifyMention(e) {
    // TODO: replace with your real email/push integration.
    // Example:
    // await sendEmail({
    //   toUserId: e.mentionedUserId,
    //   template: 'mention',
    //   meta: { projectId: e.projectId, postId: e.postId, commentId: e.commentId }
    // });
    return true;
  }
  
  module.exports = { notifyMention };
  