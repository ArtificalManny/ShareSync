import * as crypto from 'node:crypto';

export type MessageAttachmentReceiptPayload = {
  version: 1;
  uploaderId: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  expiresAt: number;
};

function getReceiptSecret(): string {
  const configured =
    process.env.MESSAGE_ATTACHMENT_SECRET ||
    process.env.JWT_SECRET;

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'MESSAGE_ATTACHMENT_SECRET or JWT_SECRET is required in production',
    );
  }

  return 'dev_secret_change_me';
}

function canonicalize(
  payload: MessageAttachmentReceiptPayload,
): string {
  return JSON.stringify([
    payload.version,
    payload.uploaderId,
    payload.fileId,
    payload.fileName,
    payload.fileUrl,
    payload.mimeType || '',
    Number(payload.fileSize || 0),
    payload.thumbnailUrl || '',
    payload.expiresAt,
  ]);
}

export function signMessageAttachmentReceipt(
  payload: MessageAttachmentReceiptPayload,
): string {
  return crypto
    .createHmac(
      'sha256',
      getReceiptSecret(),
    )
    .update(
      canonicalize(payload),
    )
    .digest('base64url');
}

export function verifyMessageAttachmentReceipt(
  payload: MessageAttachmentReceiptPayload,
  signature: string,
): boolean {
  if (
    !payload ||
    payload.version !== 1 ||
    !signature ||
    !payload.expiresAt ||
    payload.expiresAt < Date.now()
  ) {
    return false;
  }

  const expected =
    signMessageAttachmentReceipt(
      payload,
    );

  const expectedBuffer =
    Buffer.from(expected);

  const suppliedBuffer =
    Buffer.from(
      String(signature),
    );

  if (
    expectedBuffer.length !==
    suppliedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    suppliedBuffer,
  );
}
