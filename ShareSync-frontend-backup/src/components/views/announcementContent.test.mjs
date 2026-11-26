import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAnnouncementDraftState as state, normalizePollForSubmit, hasVisibleAnnouncementText } from './announcementContent.mjs';
const poll = { question: 'Choose', options: [{ text: 'A' }, { text: 'B' }] };
const file = { fileId: 'aaaaaaaaaaaaaaaaaaaaaaaa', fileUrl: '/uploads/video.mp4' };
for (const [name, input] of Object.entries({
  'single character': { title: 'U' },
  'emoji': { title: '🚀' },
  'details only': { bodyText: 'Uno' },
  'poll only': { pollEnabled: true, pollQuestion: poll.question, pollOptions: poll.options },
  'image only': { uploadedFiles: [{ url: '/uploads/image.png' }] },
  'document only': { uploadedFiles: [{ url: 'https://example.com/file.pdf' }] },
  'video project file only': { linkedProjectFiles: [file] },
  'existing poll only on edit': { editingAnnouncement: { poll } },
  'clear headline, retain body': { editingAnnouncement: { title: 'Old' }, bodyText: 'Body' },
})) test(`accept ${name}`, () => assert.equal(state(input).canPublish, true));
for (const [name, input] of Object.entries({
  'empty': {},
  'metadata only': { type: 'urgent', pinned: true, linkedMoveIds: ['a'] },
  'whitespace': { title: '  ', bodyText: '\u00a0\u200b' },
  'empty poll objects': { pollEnabled: true, pollQuestion: 'Q', pollOptions: [{ text: '' }, { text: '' }] },
  'incomplete poll with headline': { title: 'U', pollEnabled: true, pollQuestion: 'Q', pollOptions: [{ text: 'A' }] },
  'invisible poll question': { pollEnabled: true, pollQuestion: '\u200b', pollOptions: poll.options },
  'unsafe link': { uploadedFiles: [{ url: 'javascript:alert(1)' }] },
  'failed upload': { uploadedFiles: [{ url: '/uploads/a.pdf', error: 'failed' }] },
  'upload pending': { title: 'U', anyUploading: true },
  'posting': { title: 'U', posting: true },
  'unresolved file': { linkedProjectFiles: [{ fileId: 'bad' }] },
  'remove last content': { editingAnnouncement: { title: 'Old' } },
})) test(`reject ${name}`, () => assert.equal(state(input).canPublish, false));
test('empty poll option objects never become [object Object]', () => {
  assert.equal(normalizePollForSubmit(true, 'Q', [{ text: '' }, { text: '' }]), null);
});
test('invisible formatting does not count, real text is retained', () => {
  assert.equal(hasVisibleAnnouncementText('\u200b\ufe0f'), false);
  assert.equal(state({ title: ' U ' }).cleanTitle, 'U');
});
test('stored poll and votes are not sent in edit payload', () => {
  const result = state({ editingAnnouncement: { poll: { ...poll, options: [{ text: 'A', votes: ['id'] }, { text: 'B' }] } } });
  assert.equal(result.canPublish, true);
  assert.equal(result.cleanPoll, null);
});
