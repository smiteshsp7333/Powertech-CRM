import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthenticatedUser, JWTPayload, ModuleName } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'powertech_super_secret_access_jwt_key_2026';

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;

    const userRecord = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!userRecord || userRecord.isDeleted || !userRecord.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account not found, deactivated, or deleted.',
      });
      return;
    }

    req.user = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      phone: userRecord.phone,
      roleId: userRecord.roleId,
      roleName: userRecord.role.name,
      isSystem: userRecord.role.isSystem,
      permissions: userRecord.role.permissions.map((p) => ({
        module: p.module as ModuleName,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        canExport: p.canExport,
        dataScope: p.dataScope as 'OWN' | 'ALL',
      })),
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired access token.',
    });
  }
}
