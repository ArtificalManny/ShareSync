// Keep content presence in sync with backend announcement-content.policy.ts.
// The backend remains authoritative for attachment and project authorization.
const INVISIBLE = /[\s\p{Cf}\u0000-\u001f\u007f-\u009f\u034f\u115f\u1160\u17b4\u17b5\u180b-\u180d\u3164\ufe00-\ufe0f\uffa0]/gu;
export function hasVisibleAnnouncementText(value) {
  return typeof value === 'string' && value.replace(INVISIBLE, '').length > 0;
}

function optionText(option) {
  return typeof option === 'string' ? option : typeof option?.text === 'string' ? option.text : '';
}

export function normalizePollForSubmit(enabled, question, options) {
  if (!enabled || !hasVisibleAnnouncementText(question)) return null;
  const cleanOptions = (Array.isArray(options) ? options : [])
    .map(option => ({ text: optionText(option).trim() }))
    .filter(option => hasVisibleAnnouncementText(option.text))
    .slice(0, 5);
  if (cleanOptions.length < 2) return null;
  return { question: question.trim(), options: cleanOptions, closed: false };
}

function validAttachment(link) {
  if (typeof link !== 'string') return false;
  const value = link.trim();
  if (!value || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) return true;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function getAnnouncementDraftState({ title = '', bodyText = '', pollEnabled = false,
  pollQuestion = '', pollOptions = [], editingAnnouncement = null, uploadedFiles = [],
  linkedProjectFiles = [], posting = false, anyUploading = false } = {}) {
  const cleanTitle = hasVisibleAnnouncementText(title) ? title.trim() : '';
  const hasBody = hasVisibleAnnouncementText(bodyText);
  const cleanPoll = editingAnnouncement ? null : normalizePollForSubmit(pollEnabled, pollQuestion, pollOptions);
  const storedPoll = editingAnnouncement?.poll;
  const hasStoredPoll = !!normalizePollForSubmit(true, storedPoll?.question, storedPoll?.options);
  const attachmentUrls = uploadedFiles.filter(a => a?.url && !a.error && !a.uploading).map(a => a.url);
  const hasAttachment = attachmentUrls.some(validAttachment);
  const hasFile = linkedProjectFiles.some(f => /^[a-f0-9]{24}$/i.test(f?.fileId || '') &&
    typeof f?.fileUrl === 'string' && !!f.fileUrl.trim());
  const incompletePoll = !editingAnnouncement && pollEnabled && !cleanPoll;
  const hasContent = !!(cleanTitle || hasBody || cleanPoll || hasStoredPoll || hasAttachment || hasFile);
  const canPublish = hasContent && !incompletePoll && !posting && !anyUploading;
  return { cleanTitle, hasBody, cleanPoll, attachmentUrls, incompletePoll, hasContent, canPublish };
}
