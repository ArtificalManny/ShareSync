// backend/src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: any;
  }) {
    const log = new this.auditModel({
      ...entry,
      timestamp: new Date(),
    });
    return log.save();
  }
}