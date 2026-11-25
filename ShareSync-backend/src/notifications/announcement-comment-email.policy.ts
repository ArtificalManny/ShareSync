// Announcement comment email only. No follower or invite fan-out.
const OBJECT_ID = /^[a-f\d]{24}$/i;
export function commentEmailId(value: unknown): string {
  if (typeof value === 'object' && value !== null &&
      typeof (value as any).toHexString === 'function') {
    value = (value as any).toHexString();
  }
  return typeof value === 'string' && OBJECT_ID.test(value.trim())
    ? value.trim().toLowerCase() : '';
}
function firstId(...values: unknown[]): string {
  return values.map(commentEmailId).find(Boolean) || '';
}
function memberId(member: any): string {
  return firstId(member, member?.userId, member?.user, member?.memberId, member?._id, member?.id);
}
export function announcementCommentRecipients(project: any, actor: unknown): string[] {
  const sender = commentEmailId(actor);
  if (!sender || !project || project.settings?.notificationsEnabled === false ||
      project.isArchived === true || ['archived', 'deleted'].includes(String(project.status || '').trim().toLowerCase())) return [];
  const owner = firstId(project.ownerId, project.owner, project.createdBy, project.createdById);
  const members = Array.isArray(project.members) ? project.members : [];
  // Fail closed if the actor is no longer a writer. Match known membership fields.
  const actorMember = members.find((m: any) => memberId(m) === sender);
  const actorRole = String(actorMember?.role ?? '').trim().toLowerCase() || 'member';
  if (owner !== sender && (!actorMember || !['owner', 'admin', 'member'].includes(actorRole))) return [];
  const eligible = new Set<string>();
  const denied = new Set<string>();
  if (owner) eligible.add(owner);
  for (const member of members) {
    const id = memberId(member);
    if (!id) continue;
    const prefs = member?.preferences;
    if (prefs?.notifications === false || prefs?.announcements === false || prefs?.mentionsOnly === true ||
        member?.notificationsEnabled === false) denied.add(id);
    else eligible.add(id);
  }
  return [...eligible].filter(id => id !== sender && !denied.has(id));
}

// Verify the actual destination, not merely a different address on the account.
export function announcementCommentEmailAddress(user: any): string | null {
  if (!user || user.isActive !== true || user.emailOptOut === true ||
      user.notificationChannels?.email?.optIn === false) return null;
  const setting = user.settings?.emailNotifications;
  if (setting === false || user.notificationPrefs?.channels?.email === false) return null;
  const normalize = (v: unknown) => typeof v === 'string' ? v.trim().toLowerCase() : '';
  const account = normalize(user.email);
  const channel = user.notificationChannels?.email;
  const channelEmail = normalize(channel?.email);
  const address = channelEmail || account;
  if (!address || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(address)) return null;
  const verified = (address === account && user.isEmailVerified === true) ||
    (address === channelEmail && channel?.verified === true);
  return verified ? address : null;
}
