import { Injectable } from '@nestjs/common';
import { ModResult } from './moderation.types';
import { policyForText } from './policy';

@Injectable()
export class ModerationService {
  async virusScan(_localPath: string): Promise<ModResult> {
    // TODO: clamav integration; stubbed ALLOW
    return { decision: 'ALLOW' };
  }

  async checkImage(_localPath: string): Promise<ModResult> {
    // TODO: image safety scan; stubbed ALLOW
    return { decision: 'ALLOW', scores: { nudity: 0.01 } };
  }

  async checkText(text: string): Promise<ModResult> {
    return policyForText({ text });
  }

  async logDecision(payload: Record<string, any>): Promise<void> {
    // TODO: persist to DB; for now just log
    // eslint-disable-next-line no-console
    console.log('[moderation_log]', JSON.stringify(payload));
  }
}