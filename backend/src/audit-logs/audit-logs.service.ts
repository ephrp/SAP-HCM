import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditAction, AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  createLog(params: {
    action: AuditAction;
    actorUserId?: number | null;
    actorEmail?: string | null;
    targetType: string;
    targetId?: number | null;
    message: string;
    metadata?: Record<string, any> | null;
  }) {
    const log = this.repo.create({
      action: params.action,
      actorUserId: params.actorUserId ?? null,
      actorEmail: params.actorEmail ?? null,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      message: params.message,
      metadata: params.metadata ?? null,
    });

    return this.repo.save(log);
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  findByTarget(targetType: string, targetId: number) {
    return this.repo.find({
      where: {
        targetType,
        targetId,
      },
      order: { createdAt: 'DESC' },
    });
  }
}