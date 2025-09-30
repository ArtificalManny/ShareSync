// server/sockets/mentor.js
/**
 * Mentor socket helpers.
 * Rooms:
 *  - user:{userId}
 *  - project:{projectId}
 */

function joinUserRoom(socket, userId) {
    if (!userId) return;
    socket.join(`user:${userId}`);
  }
  
  function leaveUserRoom(socket, userId) {
    if (!userId) return;
    socket.leave(`user:${userId}`);
  }
  
  function joinProjectRoom(socket, projectId) {
    if (!projectId) return;
    socket.join(`project:${projectId}`);
  }
  
  function leaveProjectRoom(socket, projectId) {
    if (!projectId) return;
    socket.leave(`project:${projectId}`);
  }
  
  /**
   * Emit a newly created nudge to appropriate rooms.
   * @param {import('socket.io').Server} io
   * @param {{ id?: string,_id?: string,userId?: string|object,projectId?: string|object,title:string,body:string,createdAt?:string,read?:boolean }} nudge
   */
  function emitNudge(io, nudge) {
    if (!io || !nudge) return;
    const safe = {
      id: String(nudge.id || nudge._id || ''),
      userId: nudge.userId ? String(nudge.userId) : null,
      projectId: nudge.projectId ? String(nudge.projectId) : null,
      title: nudge.title,
      body: nudge.body,
      cta: nudge.cta || null,
      createdAt: nudge.createdAt || new Date().toISOString(),
      readAt: nudge.readAt || null,
      type: nudge.type || 'mentor',
    };
  
    if (safe.userId) io.to(`user:${safe.userId}`).emit('mentor:nudge', safe);
    if (safe.projectId) io.to(`project:${safe.projectId}`).emit('mentor:nudge', safe);
  }
  
  module.exports = {
    joinUserRoom,
    leaveUserRoom,
    joinProjectRoom,
    leaveProjectRoom,
    emitNudge,
  };
  