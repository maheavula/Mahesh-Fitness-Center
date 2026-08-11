import { persistenceService } from './persistenceService.js';
import { AuditAction, AuditLog } from '../types/index.js';

export async function logAudit(
  userId: string,
  action: AuditAction,
  metadata?: Record<string, any>
): Promise<void> {
  const auditEntry: AuditLog = {
    id: 'AUDIT-' + Math.floor(100000 + Math.random() * 900000),
    userId,
    action,
    timestamp: new Date().toISOString(),
    metadata
  };

  await persistenceService.updateData(data => {
    data.auditLogs.unshift(auditEntry);
    // Keep max 500 audit logs
    if (data.auditLogs.length > 500) {
      data.auditLogs = data.auditLogs.slice(0, 500);
    }
  });
}
