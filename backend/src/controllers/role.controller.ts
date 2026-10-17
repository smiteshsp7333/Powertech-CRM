import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

export async function getRoles(req: Request, res: Response): Promise<void> {
  const roles = await prisma.role.findMany({
    where: { isDeleted: false },
    include: {
      permissions: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ success: true, data: roles });
}

export async function getRoleById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true,
      users: { select: { id: true, name: true, email: true, isActive: true } },
    },
  });

  if (!role || role.isDeleted) {
    res.status(404).json({ success: false, error: 'Role not found.' });
    return;
  }

  res.json({ success: true, data: role });
}

export async function updateRolePermissions(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description, permissions = [] } = req.body;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true },
  });

  if (!role || role.isDeleted) {
    res.status(404).json({ success: false, error: 'Role not found.' });
    return;
  }

  // Update role info and upsert permissions
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.role.update({
      where: { id },
      data: {
        name: role.isSystem ? role.name : (name || role.name),
        description: description ?? role.description,
      },
    });

    for (const p of permissions) {
      await tx.rolePermission.upsert({
        where: {
          roleId_module: {
            roleId: id,
            module: p.module,
          },
        },
        update: {
          canView: Boolean(p.canView),
          canCreate: Boolean(p.canCreate),
          canEdit: Boolean(p.canEdit),
          canDelete: Boolean(p.canDelete),
          canExport: Boolean(p.canExport),
          dataScope: p.dataScope === 'OWN' ? 'OWN' : 'ALL',
        },
        create: {
          roleId: id,
          module: p.module,
          canView: Boolean(p.canView),
          canCreate: Boolean(p.canCreate),
          canEdit: Boolean(p.canEdit),
          canDelete: Boolean(p.canDelete),
          canExport: Boolean(p.canExport),
          dataScope: p.dataScope === 'OWN' ? 'OWN' : 'ALL',
        },
      });
    }

    return tx.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'USER_ROLE',
    entityName: 'Role',
    entityId: id,
    oldValues: role,
    newValues: updated,
  });

  res.json({ success: true, data: updated });
}
