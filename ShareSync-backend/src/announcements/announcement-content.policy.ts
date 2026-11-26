import { BadRequestException } from '@nestjs/common';
import { parseFragment, DefaultTreeAdapterMap } from 'parse5';
import { isSafeAnnouncementAttachmentLink } from './announcement-attachment-links';

// Content presence only. This is not an HTML sanitizer; the existing rendering
// and moderation boundaries remain responsible for their respective policies.
const IGNORED = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form',
  'input', 'button', 'textarea', 'select', 'option', 'template', 'noscript',
]);
const INVISIBLE = /[\s\p{Cf}\u0000-\u001f\u007f-\u009f\u034f\u115f\u1160\u17b4\u17b5\u180b-\u180d\u3164\ufe00-\ufe0f\uffa0]/gu;

export function hasVisibleAnnouncementText(value: unknown): boolean {
  return typeof value === 'string' && value.replace(INVISIBLE, '').length > 0;
}

type HtmlNode = DefaultTreeAdapterMap['node'];
function hasVisibleNode(node: HtmlNode): boolean {
  if (node.nodeName === '#text' && 'value' in node) {
    return hasVisibleAnnouncementText(node.value);
  }
  if ('tagName' in node && IGNORED.has(node.tagName.toLowerCase())) return false;
  return 'childNodes' in node && node.childNodes.some(hasVisibleNode);
}

export function hasAnnouncementBody(value: unknown): boolean {
  return typeof value === 'string' && hasVisibleNode(parseFragment(value));
}

export function normalizeAnnouncementText(value: unknown, field: string): string {
  if (value === undefined) return '';
  if (typeof value !== 'string') {
    throw new BadRequestException(`Announcement ${field} must be a string`);
  }
  const trimmed = value.trim();
  return (field === 'message' ? hasAnnouncementBody(trimmed) : hasVisibleAnnouncementText(trimmed))
    ? trimmed : '';
}

export function hasValidAnnouncementPoll(poll: any): boolean {
  return hasVisibleAnnouncementText(poll?.question) && Array.isArray(poll?.options) &&
    poll.options.filter((option: any) => hasVisibleAnnouncementText(
      typeof option === 'string' ? option : option?.text,
    )).length >= 2;
}

export function assertAnnouncementContent(content: {
  title?: unknown;
  message?: unknown;
  attachments?: unknown;
  fileReferences?: unknown;
  poll?: unknown;
}): void {
  const hasAttachment = Array.isArray(content.attachments) &&
    content.attachments.some(isSafeAnnouncementAttachmentLink);
  // Call only after the existing project-file access validation, or on already
  // stored references during a partial edit. Never trust raw client file IDs.
  const hasFile = Array.isArray(content.fileReferences) &&
    content.fileReferences.some((file: any) =>
      typeof file?.fileId === 'string' && file.fileId.trim().length > 0 &&
      typeof file?.fileUrl === 'string' && file.fileUrl.trim().length > 0);
  if (!hasVisibleAnnouncementText(content.title) && !hasAnnouncementBody(content.message) &&
      !hasAttachment && !hasFile && !hasValidAnnouncementPoll(content.poll)) {
    throw new BadRequestException('Add a headline, details, a valid poll, an attachment, or a project file');
  }
}
