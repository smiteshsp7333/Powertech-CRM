import { Request, Response, NextFunction } from 'express';
import { ModuleName, PermissionAction } from '../types';

/**
 * Higher-order middleware to enforce module-level action permissions on backend endpoints.
 * Returns 403 Forbidden if the user lacks the required permission.
 */
export function requirePermission(module: ModuleName, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    // Super Admin role has unrestricted access across all modules
    if (user.roleName === 'Super Admin' || user.isSystem) {
      next();
      return;
    }

    const permission = user.permissions.find((p) => p.module === module);

    if (!permission) {
      res.status(403).json({
        success: false,
        error: `Access denied. You do not have permissions for the ${module} module.`,
      });
      return;
    }

    let isAllowed = false;
    switch (action) {
      case 'view':
        isAllowed = permission.canView;
        break;
      case 'create':
        isAllowed = permission.canCreate;
        break;
      case 'edit':
        isAllowed = permission.canEdit;
        break;
      case 'delete':
        isAllowed = permission.canDelete;
        break;
      case 'export':
        isAllowed = permission.canExport;
        break;
    }

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        error: `Access denied. You do not have permission to ${action} records in ${module}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Returns Prisma where filter condition based on user's data scope (OWN vs ALL).
 */
export function getScopeFilter(
  user: any,
  module: ModuleName,
  ownerField: string = 'createdById'
): Record<string, any> {
  if (user.roleName === 'Super Admin' || user.isSystem) {
    return {};
  }

  const permission = user.permissions?.find((p: any) => p.module === module);
  if (permission && permission.dataScope === 'OWN') {
    return { [ownerField]: user.id };
  }

  return {};
}
