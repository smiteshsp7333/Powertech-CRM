import { Request } from 'express';
import prisma from '../config/prisma';

export interface AuditLogOptions {
  req: Request;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'EXPORT';
  module: string;
  entityName: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
}

export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const { req, action, module, entityName, entityId, oldValues, newValues } = options;

  try {
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        module,
        entityName,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
      },
    });
  } catch (error) {
    // Non-blocking error handling for audit trail logging
    console.error('[AuditLog] Failed to persist audit log entry:', error);
  }
}
