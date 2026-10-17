import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

export async function getSettings(req: Request, res: Response): Promise<void> {
  const settings = await prisma.setting.findMany({
    orderBy: { category: 'asc' },
  });

  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  res.json({ success: true, data: { list: settings, map: settingsMap } });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { settings = [] } = req.body; // Array of { key: string, value: string }

  if (!Array.isArray(settings)) {
    res.status(400).json({ success: false, error: 'Settings array required.' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const s of settings) {
      await tx.setting.upsert({
        where: { key: s.key },
        update: { value: String(s.value) },
        create: {
          key: s.key,
          value: String(s.value),
          category: s.category || 'GENERAL',
          description: s.description || null,
        },
      });
    }

    return tx.setting.findMany();
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'SETTING',
    entityName: 'Settings',
    entityId: 'SYSTEM',
    newValues: settings,
  });

  res.json({ success: true, data: updated });
}
