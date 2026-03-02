// src/services/reminderService.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.2: Background reminder service
//
// Checks for upcoming due dates and emits in-app reminder events.
// Designed to run on a setInterval (every 5 minutes).
// Does NOT depend on external cron libraries — uses plain JS setInterval.
//
// Future: add push notifications, email digests, SMS.
// For now: emits socket events to connected users.
// ═══════════════════════════════════════════════════════════════════════════════

"use strict";

let prisma = null;
let io = null;
let intervalHandle = null;
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const REMINDER_OFFSETS_MS = {
  at_due: 0,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

// Track which reminders we've already sent (in-memory, resets on server restart)
// Key: `${taskId}-${reminderType}`, Value: timestamp sent
const sentReminders = new Map();
const MAX_SENT_CACHE = 10000;

function cleanSentCache() {
  if (sentReminders.size > MAX_SENT_CACHE) {
    // Remove oldest half
    const entries = [...sentReminders.entries()];
    entries.sort((a, b) => a[1] - b[1]);
    const toRemove = entries.slice(0, Math.floor(MAX_SENT_CACHE / 2));
    toRemove.forEach(([key]) => sentReminders.delete(key));
  }
}

async function checkReminders() {
  if (!prisma) {
    console.warn('[ReminderService] Prisma client not initialized');
    return;
  }

  try {
    const now = new Date();
    const maxLookahead = new Date(now.getTime() + 24 * 60 * 60 * 1000 + CHECK_INTERVAL);

    // Find tasks with due dates in the reminder window
    // that are not completed and have a dueDate set
    let tasks;
    try {
      tasks = await prisma.task.findMany({
        where: {
          completed: false,
          dueDate: {
            gte: new Date(now.getTime() - 60 * 60 * 1000), // include recently past (1h)
            lte: maxLookahead,
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          createdById: true,
          assignedToId: true,
          projectId: true,
          priority: true,
          reminder: true,
        },
      });
    } catch (queryErr) {
      // If the 'reminder' field doesn't exist in schema yet, retry without it
      if (queryErr.message && queryErr.message.includes('reminder')) {
        tasks = await prisma.task.findMany({
          where: {
            completed: false,
            dueDate: {
              gte: new Date(now.getTime() - 60 * 60 * 1000),
              lte: maxLookahead,
            },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            createdById: true,
            assignedToId: true,
            projectId: true,
            priority: true,
          },
        });
      } else {
        throw queryErr;
      }
    }

    if (!tasks || tasks.length === 0) return;

    for (const task of tasks) {
      const dueTime = new Date(task.dueDate).getTime();
      const reminderType = task.reminder || 'at_due';
      const offsetMs = REMINDER_OFFSETS_MS[reminderType] ?? 0;

      // Calculate when the reminder should fire
      const reminderTime = dueTime - offsetMs;

      // Check if we're within the window to fire this reminder
      // (current time is within CHECK_INTERVAL of the reminder time)
      const timeDiff = reminderTime - now.getTime();
      if (timeDiff > CHECK_INTERVAL || timeDiff < -CHECK_INTERVAL) {
        continue; // Not in window
      }

      // Check if already sent
      const cacheKey = `${task.id}-${reminderType}`;
      if (sentReminders.has(cacheKey)) {
        continue;
      }

      // Determine who to notify
      const userIds = new Set();
      if (task.createdById) userIds.add(task.createdById);
      if (task.assignedToId) userIds.add(task.assignedToId);

      if (userIds.size === 0) continue;

      // Build notification payload
      const notification = {
        type: 'TASK_REMINDER',
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority || null,
        projectId: task.projectId || null,
        reminderType,
        message: buildReminderMessage(task, reminderType),
        timestamp: new Date().toISOString(),
      };

      // Send via socket.io if available
      if (io) {
        userIds.forEach((userId) => {
          try {
            io.to(`user:${userId}`).emit('notification', notification);
            io.to(`user:${userId}`).emit('task:reminder', notification);
          } catch (emitErr) {
            console.warn('[ReminderService] Socket emit failed for user:', userId, emitErr.message);
          }
        });
      }

      // Mark as sent
      sentReminders.set(cacheKey, Date.now());

      console.log(`[ReminderService] Sent ${reminderType} reminder for task "${task.title}" to ${userIds.size} user(s)`);
    }

    cleanSentCache();
  } catch (err) {
    console.error('[ReminderService] Error checking reminders:', err.message);
  }
}

function buildReminderMessage(task, reminderType) {
  const title = task.title || 'Untitled task';

  switch (reminderType) {
    case 'at_due':
      return `"${title}" is due now`;
    case '15m':
      return `"${title}" is due in 15 minutes`;
    case '1h':
      return `"${title}" is due in 1 hour`;
    case '3h':
      return `"${title}" is due in 3 hours`;
    case '1d':
      return `"${title}" is due tomorrow`;
    default:
      return `Reminder: "${title}" is coming up`;
  }
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Initialize the reminder service
 * @param {Object} prismaClient — Prisma client instance
 * @param {Object} socketIo — Socket.io server instance (optional)
 */
function init(prismaClient, socketIo) {
  prisma = prismaClient;
  io = socketIo || null;

  console.log('[ReminderService] Initialized');
}

/**
 * Start the background check interval
 */
function start() {
  if (intervalHandle) {
    console.warn('[ReminderService] Already running');
    return;
  }

  // Run immediately on start
  checkReminders();

  // Then every CHECK_INTERVAL
  intervalHandle = setInterval(checkReminders, CHECK_INTERVAL);
  console.log(`[ReminderService] Started (checking every ${CHECK_INTERVAL / 1000}s)`);
}

/**
 * Stop the background check interval
 */
function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[ReminderService] Stopped');
  }
}

/**
 * Force an immediate check (useful for testing or after task updates)
 */
function forceCheck() {
  return checkReminders();
}

module.exports = {
  init,
  start,
  stop,
  forceCheck,
};
