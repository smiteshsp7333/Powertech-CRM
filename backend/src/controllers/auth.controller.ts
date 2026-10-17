import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'powertech_super_secret_access_jwt_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'powertech_super_secret_refresh_jwt_key_2026';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required.',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user || user.isDeleted || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials or inactive account.',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials.',
    });
    return;
  }

  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: (JWT_ACCESS_EXPIRY as any) || '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: (JWT_REFRESH_EXPIRY as any) || '7d' });

  // Log successful login
  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    roleId: user.roleId,
    roleName: user.role.name,
    isSystem: user.role.isSystem,
    permissions: user.role.permissions.map((p) => ({
      module: p.module as any,
      canView: p.canView,
      canCreate: p.canCreate,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
      canExport: p.canExport,
      dataScope: p.dataScope as any,
    })),
  };

  await logAuditEvent({
    req,
    action: 'LOGIN',
    module: 'AUTH',
    entityName: 'User',
    entityId: user.id,
    newValues: { email: user.email, role: user.role.name },
  });

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          isSystem: user.role.isSystem,
          permissions: user.role.permissions,
        },
      },
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: 'Refresh token is required.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email: string; roleId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || user.isDeleted || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User not found or deactivated.',
      });
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const newAccessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: (JWT_ACCESS_EXPIRY as any) || '15m' });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token.',
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId || !currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: 'Current password and new password are required.',
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    res.status(400).json({ success: false, error: 'Current password does not match.' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'AUTH',
    entityName: 'User',
    entityId: userId,
    newValues: { action: 'PASSWORD_CHANGED' },
  });

  res.json({
    success: true,
    message: 'Password updated successfully.',
  });
}
