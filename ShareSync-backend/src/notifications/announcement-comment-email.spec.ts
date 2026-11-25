import { announcementCommentEmailAddress, announcementCommentRecipients } from './announcement-comment-email.policy';
import { EmailService } from './email.service';

const actor = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const other = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const third = 'cccccccccccccccccccccccc';
const event = { projectId: actor, announcementId: third, commentId: actor, recipientId: other };
const user = { _id: other, isActive: true, email: 'recipient@example.test', isEmailVerified: true };

describe('announcement comment email recipient policy', () => {
  it('includes owner and members once, but never actor, followers or pending invites', () => {
    expect(announcementCommentRecipients({ ownerId: other, members: [{ userId: actor }, { userId: other }, { memberId: third, role: 'viewer' }], followers: [{ userId: 'dddddddddddddddddddddddd' }], invites: [{ userId: 'eeeeeeeeeeeeeeeeeeeeeeee' }] }, actor)).toEqual([other, third]);
  });
  it('honors duplicate-member opt-outs, announcement preferences and mentions-only', () => {
    expect(announcementCommentRecipients({ ownerId: actor, members: [{ userId: other }, { userId: other, preferences: { announcements: false } }, { userId: third, preferences: { mentionsOnly: true } }] }, actor)).toEqual([]);
  });
  it('fails closed for missing projects, removed actors, readers and disabled projects', () => {
    expect(announcementCommentRecipients(null, actor)).toEqual([]);
    expect(announcementCommentRecipients({ ownerId: other, members: [] }, actor)).toEqual([]);
    expect(announcementCommentRecipients({ ownerId: other, members: [{ userId: actor, role: 'viewer' }] }, actor)).toEqual([]);
    expect(announcementCommentRecipients({ ownerId: actor, members: [{ userId: other }], settings: { notificationsEnabled: false } }, actor)).toEqual([]);
  });
  it('requires an active account and a verified actual destination', () => {
    expect(announcementCommentEmailAddress(user)).toBe(user.email);
    expect(announcementCommentEmailAddress({ ...user, isActive: false })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, emailOptOut: true })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, settings: { emailNotifications: true }, notificationChannels: { email: { optIn: false } } })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, settings: { emailNotifications: true }, notificationPrefs: { channels: { email: false } } })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, settings: { emailNotifications: false } })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, notificationChannels: { email: { email: 'different@example.test', verified: false } } })).toBeNull();
    expect(announcementCommentEmailAddress({ ...user, isEmailVerified: false })).toBeNull();
  });
});

describe('announcement comment Resend transport (mocked)', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: jest.Mock;
  beforeEach(() => {
    originalEnv = process.env;
    originalFetch = globalThis.fetch;
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-not-a-real-key', RESEND_FROM: 'OpenShare <test@example.test>', FRONTEND_URL: 'https://openshare.ca', ANNOUNCEMENT_COMMENT_EMAIL_ENABLED: 'true' };
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as any;
  });
  afterEach(() => { process.env = originalEnv; globalThis.fetch = originalFetch; });
  it('uses one recipient, stable idempotency key, branded template and generic body', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'provider-id' }) });
    const service = new EmailService();
    expect(await service.sendAnnouncementCommentEmail(user, event)).toEqual({ status: 'accepted', providerMessageId: 'provider-id' });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(request.headers['Idempotency-Key']).toBe(`announcement-comment/${event.commentId}/${other}`);
    const body = JSON.parse(request.body);
    expect(body.to).toBe(user.email);
    expect(body.html).toContain('openshare-email-lockup.png');
    expect(body.html).toContain('Manage notification preferences');
    expect(body.html).toContain(`https://openshare.ca/projects/${actor}`);
    expect(body.text).toContain('View in OpenShare');
  });
  it('does not send when disabled, identity mismatches or the recipient opted out', async () => {
    const service = new EmailService();
    process.env.ANNOUNCEMENT_COMMENT_EMAIL_ENABLED = 'false';
    expect((await service.sendAnnouncementCommentEmail(user, event)).status).toBe('skipped');
    process.env.ANNOUNCEMENT_COMMENT_EMAIL_ENABLED = 'true';
    expect((await service.sendAnnouncementCommentEmail({ ...user, emailOptOut: true }, event)).status).toBe('skipped');
    expect((await service.sendAnnouncementCommentEmail(user, { ...event, recipientId: actor })).status).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('distinguishes transient provider errors and permanent rejections', async () => {
    const service = new EmailService();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) }).mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) }).mockRejectedValueOnce(new Error('offline'));
    expect(await service.sendAnnouncementCommentEmail(user, event)).toMatchObject({ status: 'failed', retryable: true, httpStatus: 429 });
    expect(await service.sendAnnouncementCommentEmail(user, event)).toMatchObject({ status: 'failed', retryable: false, httpStatus: 400 });
    expect(await service.sendAnnouncementCommentEmail(user, event)).toMatchObject({ status: 'failed', retryable: true });
  });
});
