import { Injectable, Logger } from '@nestjs/common';

/**
 * AuditService
 * Thin facade that exposes audit/system events in a way ActivitiesService can consume.
 * If you already have an audit repository, inject it here and adapt the mapping.
 *
 * This file is optional unless you need to centrally merge audit events into /activities.
 */

export type AuditListParams = {
  projectId?: string;
  userId?: string;
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null;
  limit?: number;
  types?: string[]; // e.g., ['member_joined','permission']
};

export type UnifiedAuditItem = {
  _id: string;
  type: string;      // normalized like 'audit.member_joined'
  text?: string;
  summary?: string;
  meta?: Record<string, any>;
  projectId?: string;
  userId?: string;
  createdAt: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  // constructor(private readonly repo: YourAuditRepo) {}

  /**
   * List audit/system events, returning a page of items plus a nextCursor if more.
   * Replace the mock implementation with your datastore queries.
   */
  async list(params: AuditListParams): Promise<{ items: UnifiedAuditItem[]; nextCursor: string | null }> {
    const { limit = 20 } = params;

    // TODO: Replace with real query. This is a safe placeholder so wiring compiles.
    const items: UnifiedAuditItem[] = [];

    // Example mapping:
    // const raw = await this.repo.find({ ...params });
    // const items = raw.map(r => ({
    //   _id: String(r._id),
    //   type: `audit.${r.kind}`, // normalize
    //   summary: r.message,
    //   meta: r.meta ?? {},
    //   projectId: r.projectId,
    //   userId: r.userId,
    //   createdAt: r.createdAt ?? new Date().toISOString(),
    // }));

    const nextCursor = items.length === limit ? 'next-cursor-token' : null;
    return { items, nextCursor };
  }

  /** Convert audit items into CSV lines (optional helper). */
  toCsv(items: UnifiedAuditItem[]): string {
    const headers = ['id', 'type', 'summary', 'projectId', 'userId', 'createdAt'];
    const rows = items.map((i) =>
      [
        i._id,
        i.type,
        (i.summary || i.text || '').replace(/"/g, '""'),
        i.projectId || '',
        i.userId || '',
        i.createdAt || '',
      ]
        .map((v) => `"${String(v)}"`)
        .join(',')
    );
    return `${headers.join(',')}\n${rows.join('\n')}\n`;
  }
}
