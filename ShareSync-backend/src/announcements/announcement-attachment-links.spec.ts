import { BadRequestException } from '@nestjs/common';
import {
  MAX_ANNOUNCEMENT_ATTACHMENTS,
  isSafeAnnouncementAttachmentLink,
  normalizeAnnouncementAttachmentLinks,
} from './announcement-attachment-links';
import { AnnouncementsService } from './announcements.service';

// openshare-announcement-attachment-links-v1 (R50)

const SAFE = [
  'https://pub-821076f501af4122a6dedcf36a1206be.r2.dev/uploads/1f1e-2d2c.pdf',
  'http://localhost:5050/uploads/a.png',
  'HTTPS://Example.com/report.pdf?x=1#page=2',
  '/uploads/older-file.png',
  'uploads/older-file.png',
];

const UNSAFE = [
  'javascript:alert(1)',
  'JavaScript:alert(document.cookie)',
  ' javascript:alert(1)',
  'java\tscript:alert(1)',
  'javascript\n:alert(1)',
  '\u0001javascript:alert(1)',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'ftp://example.com/a.pdf',
  '//evil.example/x.pdf',
  '/api/uploads/a.pdf',
  '/uploads/a\nb.png',
  '/uploads/a\u0000b.png',
  'https://user:pass@example.com/a.pdf',
  'https://user@example.com/a.pdf',
  'https://',
  'not a link',
  '',
  '   ',
  `https://example.com/${'a'.repeat(2048)}`,
];

describe('R50 announcement attachment links', () => {
  it.each(SAFE)('accepts %p', (link) => {
    expect(isSafeAnnouncementAttachmentLink(link)).toBe(true);
  });

  it.each(UNSAFE)('refuses %p', (link) => {
    expect(isSafeAnnouncementAttachmentLink(link)).toBe(false);
  });

  it('refuses values that are not strings', () => {
    for (const value of [null, undefined, 1, {}, { url: SAFE[0] }, [SAFE[0]]]) {
      expect(isSafeAnnouncementAttachmentLink(value)).toBe(false);
    }
  });

  it('turns a missing list into an empty one', () => {
    expect(normalizeAnnouncementAttachmentLinks(undefined)).toEqual([]);
    expect(normalizeAnnouncementAttachmentLinks(null)).toEqual([]);
  });

  it('accepts and trims safe links', () => {
    expect(normalizeAnnouncementAttachmentLinks([` ${SAFE[0]} `, SAFE[3]])).toEqual([SAFE[0], SAFE[3]]);
  });

  it('refuses a list that holds any unsafe link', () => {
    for (const link of UNSAFE) {
      expect(() => normalizeAnnouncementAttachmentLinks([SAFE[0], link])).toThrow(BadRequestException);
    }
  });

  it('refuses something that is not a list, and lists that are too long', () => {
    expect(() => normalizeAnnouncementAttachmentLinks(SAFE[0])).toThrow(BadRequestException);
    expect(() => normalizeAnnouncementAttachmentLinks({ 0: SAFE[0] })).toThrow(BadRequestException);
    const tooMany = Array.from({ length: MAX_ANNOUNCEMENT_ATTACHMENTS + 1 }, () => SAFE[0]);
    expect(() => normalizeAnnouncementAttachmentLinks(tooMany)).toThrow(BadRequestException);
    expect(normalizeAnnouncementAttachmentLinks(tooMany.slice(1))).toHaveLength(MAX_ANNOUNCEMENT_ATTACHMENTS);
  });

  it('keeps links an announcement already has, so older ones stay editable', () => {
    const stored = ['/api/uploads/legacy.pdf', SAFE[0]];
    expect(normalizeAnnouncementAttachmentLinks(stored, stored)).toEqual(stored);
    expect(() => normalizeAnnouncementAttachmentLinks([...stored, 'javascript:alert(1)'], stored)).toThrow(
      BadRequestException,
    );
  });

  it('does not let a new unsafe link ride on a stored one', () => {
    expect(() => normalizeAnnouncementAttachmentLinks(['javascript:alert(1)'], ['javascript:alert(2)'])).toThrow(
      BadRequestException,
    );
  });
});

describe('R50 announcement responses without email addresses', () => {
  it('never populates email for authors or commenters', () => {
    const service = new AnnouncementsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const fields = String((service as any).userPopulateFields).split(/\s+/);
    expect(fields).toEqual(expect.arrayContaining(['firstName', 'lastName', 'username', 'avatar']));
    expect(fields).not.toContain('email');
  });
});
