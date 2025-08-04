// src/utils/logUserActivity.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Logs a user activity event to support streak tracking.
 * Accepted types: 'task', 'comment', 'forum', 'file', 'assignment'
 */
export async function logUserActivity(userId: string, activity: string, relatedId?: string) {
  const prisma = new PrismaClient();
  await prisma.userActivity.create({
    data: {
      userId,
      activity,
      relatedId, // optional
    },
  });
}

