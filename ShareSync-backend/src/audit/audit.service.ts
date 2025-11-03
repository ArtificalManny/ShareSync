// src/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from './schemas/audit.schema';

export type AuditListParams = {
  projectId?: string;
  userId?: string;
  range?: '24h' | '7d' | '30d' | 'all';
  cursor?: string | null;
  limit?: number;
  types?: string[];
};

export type UnifiedAuditItem = {
  _id: string;
  type: string;
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

  constructor(@InjectModel(Audit.name) private auditModel: Model<AuditDocument>) {}

  async list(params: AuditListParams): Promise<{ items: UnifiedAuditItem[]; nextCursor: string | null }> {
    const { limit = 20 } = params;
    const items: UnifiedAuditItem[] = [];
    const nextCursor = items.length === limit ? 'next-cursor-token' : null;
    return { items, nextCursor };
  }

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

  async logProjectShipped(projectId: string, userId: string, project: any) {
    const audit = new this.auditModel({
      type: 'project_shipped',
      actor: { id: userId },
      target: { id: projectId, type: 'project' },
      action: 'shipped',
      meta: {
        projectTitle: project.title,
        shippedAt: new Date(),
      },
    });
    return audit.save();
  }
}