export type Decision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface ModResult {
  decision: Decision;
  scores?: Record<string, number>;
  reason?: string;
  caseId?: string;
}

export interface UploadPolicyInput {
  ext: string;
  sizeBytes: number;
  mime: string;
  virus?: ModResult;
  image?: ModResult | null;
}

export interface TextPolicyInput {
  text: string;
}
