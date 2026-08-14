import { Connection, Types } from 'mongoose';

export interface ValidatedWsSession {
  userId: string;
  user: any;
}

/**
 * websocket-live-session-validation-v1
 *
 * JWT signature/expiry validation happens before this helper is called.
 *
 * This second step mirrors the session invariants enforced by the HTTP JWT
 * strategy that matter to an already-issued token:
 *
 * 1. The User document must still exist.
 * 2. The tokenVersion embedded in the JWT must still equal the User's current
 *    tokenVersion.
 *
 * Therefore permanent account deletion, password changes, and password resets
 * immediately invalidate an otherwise unexpired WebSocket JWT.
 */
export async function validateWsSession(
  connection: Connection,
  payload: any,
): Promise<ValidatedWsSession> {
  const userId = String(
    payload?.sub ||
    payload?.userId ||
    payload?.id ||
    payload?._id ||
    '',
  ).trim();

  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid WebSocket token payload');
  }

  const userModel = connection.models?.User;

  if (!userModel) {
    throw new Error('User model is unavailable for WebSocket authentication');
  }

  const user = await userModel
    .findById(userId)
    .select(
      '_id tokenVersion accountStatus suspendedUntil roles username email firstName lastName',
    )
    .lean()
    .exec();

  if (!user) {
    throw new Error('User not found');
  }

  const tokenVersion = Number(payload?.tokenVersion ?? 0);
  const currentTokenVersion = Number((user as any)?.tokenVersion ?? 0);

  if (
    !Number.isFinite(tokenVersion) ||
    !Number.isFinite(currentTokenVersion) ||
    tokenVersion !== currentTokenVersion
  ) {
    throw new Error('Session expired');
  }

  return {
    userId,
    user,
  };
}
