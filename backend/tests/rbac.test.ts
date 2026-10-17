import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/prisma';
import { authenticateToken } from '../src/middleware/auth';
import { requirePermission } from '../src/middleware/rbac';

const testApp = express();
testApp.use(express.json());

// Protected routes using our real middlewares
testApp.get(
  '/api/test/purchases',
  authenticateToken,
  requirePermission('PURCHASE', 'view'),
  (req: Request, res: Response) => {
    res.json({ success: true, message: 'Purchase records retrieved.' });
  }
);

testApp.get(
  '/api/test/billing',
  authenticateToken,
  requirePermission('BILLING', 'view'),
  (req: Request, res: Response) => {
    res.json({ success: true, message: 'Billing records retrieved.' });
  }
);

describe('RBAC Middleware & Permission Enforcement', () => {
  let salesToken: string;
  let accountsToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'powertech_super_secret_access_jwt_key_2026';

    const salesUser = await prisma.user.findUnique({ where: { email: 'sales@powertech.com' } });
    const accountsUser = await prisma.user.findUnique({ where: { email: 'accounts@powertech.com' } });
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@powertech.com' } });

    if (!salesUser || !accountsUser || !adminUser) {
      throw new Error('Seed users not found. Run seed script first.');
    }

    salesToken = jwt.sign({ userId: salesUser.id, email: salesUser.email, roleId: salesUser.roleId }, JWT_SECRET);
    accountsToken = jwt.sign({ userId: accountsUser.id, email: accountsUser.email, roleId: accountsUser.roleId }, JWT_SECRET);
    adminToken = jwt.sign({ userId: adminUser.id, email: adminUser.email, roleId: adminUser.roleId }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('rejects unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(testApp).get('/api/test/purchases');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('blocks restricted role (Sales) from calling Purchases endpoint with 403 Forbidden', async () => {
    const res = await request(testApp)
      .get('/api/test/purchases')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Access denied');
  });

  test('allows Accounts user to access Billing endpoint with 200 OK', async () => {
    const res = await request(testApp)
      .get('/api/test/billing')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('allows Super Admin to access any module with 200 OK', async () => {
    const resPurchases = await request(testApp)
      .get('/api/test/purchases')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resPurchases.status).toBe(200);

    const resBilling = await request(testApp)
      .get('/api/test/billing')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resBilling.status).toBe(200);
  });
});
