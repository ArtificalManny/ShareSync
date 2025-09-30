// server/utils/email/sockets/posts.js
const events = require('../system/events');

/**
 * Bridge post-related events to Socket.IO rooms.
 * Rooms we emit to:
 *  - project:{projectId}
 *
 * @param {import('socket.io').Server} io
 */
function wirePostSockets(io) {
  if (!io) return;

  events.on('post_created', (e) => {
    // { projectId, postId, post? }
    if (!e?.projectId) return;
    io.to(`project:${e.projectId}`).emit('posts:created', {
      projectId: String(e.projectId),
      post: e.post || e, // if controller passed the whole post in e.post, prefer that
    });
  });

  events.on('post_updated', (e) => {
    // { projectId, postId, post? }
    if (!e?.projectId) return;
    io.to(`project:${e.projectId}`).emit('posts:updated', {
      projectId: String(e.projectId),
      post: e.post || { id: e.postId }, // controller should ideally include full post
    });
  });

  events.on('post_reaction_toggled', (e) => {
    // { projectId, postId, userId, emoji, action, post? }
    if (!e?.projectId) return;
    io.to(`project:${e.projectId}`).emit('posts:updated', {
      projectId: String(e.projectId),
      post: e.post || { id: e.postId }, // let client refetch if partial
    });
  });

  events.on('comment_created', (e) => {
    // { projectId, postId, commentId, comment? }
    if (!e?.projectId) return;
    io.to(`project:${e.projectId}`).emit('posts:updated', {
      projectId: String(e.projectId),
      post: { id: e.postId }, // notify clients to refresh this post's thread
    });
  });
}

module.exports = { wirePostSockets };
