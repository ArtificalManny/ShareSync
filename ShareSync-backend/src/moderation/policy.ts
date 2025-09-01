import { Decision, ModResult, UploadPolicyInput, TextPolicyInput } from './moderation.types';

const BAD_EXT = new Set(['exe','dmg','js','bat','cmd','sh']);
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

export function policyForUpload(input: UploadPolicyInput): { decision: Decision; reason?: string; caseId?: string } {
  const { ext, sizeBytes, virus, image } = input;

  if (sizeBytes > MAX_BYTES) return { decision: 'BLOCK', reason: 'File too large' };
  if (BAD_EXT.has((ext || '').toLowerCase())) return { decision: 'BLOCK', reason: `.${ext} files are not allowed` };

  if (virus?.decision === 'BLOCK') {
    return { decision: 'BLOCK', reason: virus.reason || 'Virus detected' };
  }

  // If image scanner says REVIEW, bubble that up.
  if (image?.decision === 'REVIEW') {
    return { decision: 'REVIEW', reason: image.reason || 'Image requires review' };
  }

  return { decision: 'ALLOW' };
}

export function policyForText(input: TextPolicyInput): ModResult {
  const txt = (input.text || '').toLowerCase();

  // Extremely minimal, replace with real heuristics later.
  if (!txt.trim()) return { decision: 'ALLOW' };

  const banned = ['threat to kill', 'bomb', 'csam']; // placeholder examples
  if (banned.some((w) => txt.includes(w))) {
    return { decision: 'BLOCK', reason: 'Text appears to violate content policy' };
  }

  // Stub: if contains “nsfw”, send to review
  if (txt.includes('nsfw')) {
    return { decision: 'REVIEW', reason: 'Text requires review' };
  }

  return { decision: 'ALLOW' };
}