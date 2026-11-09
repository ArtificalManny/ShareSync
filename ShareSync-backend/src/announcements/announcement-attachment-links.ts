import { BadRequestException } from '@nestjs/common';

// openshare-announcement-attachment-links-v1
//
// Announcement and comment attachments are stored as plain links and shown to
// other people as clickable links. Only two kinds are accepted:
//
// - absolute http(s) links without a user name or password in them;
// - the app's own upload paths, "/uploads/..." (older files stored on the
//   backend's disk).
//
// Anything else, such as "javascript:", "data:" or a protocol-relative "//host"
// link, is refused. When an announcement is edited, links it already has are
// kept as they are, so older announcements stay editable.

export const MAX_ANNOUNCEMENT_ATTACHMENTS = 50;
const MAX_LINK_LENGTH = 2048;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function isSafeAnnouncementAttachmentLink(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const link = value.trim();
  if (!link || link.length > MAX_LINK_LENGTH || CONTROL_CHARACTERS.test(link)) {
    return false;
  }

  if (link.startsWith('/uploads/') || link.startsWith('uploads/')) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return false;
  }

  return (
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    Boolean(url.hostname) &&
    !url.username &&
    !url.password
  );
}

export function normalizeAnnouncementAttachmentLinks(
  input: unknown,
  alreadyStored: unknown = [],
): string[] {
  if (input === undefined || input === null) return [];

  if (!Array.isArray(input) || input.length > MAX_ANNOUNCEMENT_ATTACHMENTS) {
    throw new BadRequestException('Invalid Announcement attachments');
  }

  const kept = new Set(
    (Array.isArray(alreadyStored) ? alreadyStored : [])
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((item) => item.trim()),
  );

  return input.map((item: unknown): string => {
    if (typeof item === 'string' && kept.has(item.trim())) {
      return item.trim();
    }

    if (!isSafeAnnouncementAttachmentLink(item)) {
      throw new BadRequestException(
        'Announcement attachments must be http(s) links or uploaded files',
      );
    }

    return (item as string).trim();
  });
}
