import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { round2 } from '../utils/calculations';
import { logAuditEvent } from '../utils/audit';

export async function getDailySummary(req: Request, res: Response): Promise<void> {
  const { startDate, endDate, view = 'daily' } = req.query;

  // Default to current month if no dates provided
  const now = new Date();
  const start = startDate
    ? new Date(startDate as string)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate
    ? new Date(endDate as string)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Fetch Invoices (Billing) in range
  const invoices = await prisma.invoice.findMany({
    where: {
      isDeleted: false,
      billingDate: { gte: start, lte: end },
    },
    select: { billingDate: true, totalAmount: true },
  });

  // 2. Fetch Payments (Collections) in range
  const payments = await prisma.payment.findMany({
    where: {
      isDeleted: false,
      paymentDate: { gte: start, lte: end },
    },
    select: { paymentDate: true, amountReceived: true },
  });

  // 3. Fetch Purchases in range
  const purchases = await prisma.purchase.findMany({
    where: {
      isDeleted: false,
      purchaseDate: { gte: start, lte: end },
    },
    select: { purchaseDate: true, totalAmount: true },
  });

  // 4. Fetch Manual Adjustments
  const adjustments = await prisma.dailyAdjustment.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: { authorizedBy: { select: { id: true, name: true } } },
  });

  // 5. Fetch Locks
  const locks = await prisma.dailySummaryLock.findMany({
    where: {
      date: { gte: start, lte: end },
    },
  });
  const lockMap = new Set(locks.filter((l) => l.isLocked).map((l) => l.date.toISOString().slice(0, 10)));

  // Aggregate by Date (YYYY-MM-DD)
  const dateMap: Record<
    string,
    {
      date: string;
      billingAmount: number;
      collectionAmount: number;
      purchaseAmount: number;
      adjustmentAmount: number;
      netCashFlow: number;
      isLocked: boolean;
      adjustments: any[];
    }
  > = {};

  const ensureEntry = (dateStr: string) => {
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        billingAmount: 0,
        collectionAmount: 0,
        purchaseAmount: 0,
        adjustmentAmount: 0,
        netCashFlow: 0,
        isLocked: lockMap.has(dateStr),
        adjustments: [],
      };
    }
  };

  invoices.forEach((inv) => {
    const d = inv.billingDate.toISOString().slice(0, 10);
    ensureEntry(d);
    dateMap[d].billingAmount = round2(dateMap[d].billingAmount + inv.totalAmount);
  });

  payments.forEach((p) => {
    const d = p.paymentDate.toISOString().slice(0, 10);
    ensureEntry(d);
    dateMap[d].collectionAmount = round2(dateMap[d].collectionAmount + p.amountReceived);
  });

  purchases.forEach((pur) => {
    const d = pur.purchaseDate.toISOString().slice(0, 10);
    ensureEntry(d);
    dateMap[d].purchaseAmount = round2(dateMap[d].purchaseAmount + pur.totalAmount);
  });

  adjustments.forEach((adj) => {
    const d = adj.date.toISOString().slice(0, 10);
    ensureEntry(d);
    dateMap[d].adjustmentAmount = round2(dateMap[d].adjustmentAmount + adj.amount);
    dateMap[d].adjustments.push(adj);
  });

  // Compute Net for each day (Collection - Purchase + Adjustment)
  let overallBilling = 0;
  let overallCollection = 0;
  let overallPurchase = 0;
  let overallAdjustment = 0;

  const rows = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
  rows.forEach((r) => {
    r.netCashFlow = round2(r.collectionAmount - r.purchaseAmount + r.adjustmentAmount);
    overallBilling = round2(overallBilling + r.billingAmount);
    overallCollection = round2(overallCollection + r.collectionAmount);
    overallPurchase = round2(overallPurchase + r.purchaseAmount);
    overallAdjustment = round2(overallAdjustment + r.adjustmentAmount);
  });

  res.json({
    success: true,
    data: {
      range: { startDate: start.toISOString(), endDate: end.toISOString(), view },
      totals: {
        billing: overallBilling,
        collection: overallCollection,
        purchase: overallPurchase,
        adjustments: overallAdjustment,
        netCashFlow: round2(overallCollection - overallPurchase + overallAdjustment),
      },
      dailyRecords: rows,
    },
  });
}

export async function addAdjustment(req: Request, res: Response): Promise<void> {
  const { date, type, amount, reason } = req.body;

  if (!date || !amount || !reason) {
    res.status(400).json({ success: false, error: 'Date, amount, and reason are required.' });
    return;
  }

  const adjDate = new Date(date);
  const dateStr = adjDate.toISOString().slice(0, 10);

  // Check if date is locked
  const lock = await prisma.dailySummaryLock.findFirst({
    where: {
      date: {
        gte: new Date(`${dateStr}T00:00:00.000Z`),
        lte: new Date(`${dateStr}T23:59:59.999Z`),
      },
      isLocked: true,
    },
  });

  if (lock) {
    res.status(403).json({
      success: false,
      error: `Daily entries for ${dateStr} are locked and cannot be modified.`,
    });
    return;
  }

  const adjustment = await prisma.dailyAdjustment.create({
    data: {
      date: adjDate,
      type: type || 'BILLING_ADJUSTMENT',
      amount: round2(Number(amount)),
      reason,
      authorizedById: req.user!.id,
    },
    include: { authorizedBy: { select: { id: true, name: true } } },
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'DAILY_SUMMARY',
    entityName: 'DailyAdjustment',
    entityId: adjustment.id,
    newValues: adjustment,
  });

  res.status(201).json({ success: true, data: adjustment });
}

export async function toggleDayLock(req: Request, res: Response): Promise<void> {
  const { date, isLocked, notes } = req.body;

  if (!date) {
    res.status(400).json({ success: false, error: 'Date is required.' });
    return;
  }

  const targetDate = new Date(new Date(date).toISOString().slice(0, 10) + 'T00:00:00.000Z');

  const lock = await prisma.dailySummaryLock.upsert({
    where: { date: targetDate },
    update: {
      isLocked: Boolean(isLocked),
      lockedById: isLocked ? req.user!.id : null,
      lockedAt: isLocked ? new Date() : null,
      notes,
    },
    create: {
      date: targetDate,
      isLocked: Boolean(isLocked),
      lockedById: isLocked ? req.user!.id : null,
      lockedAt: isLocked ? new Date() : null,
      notes,
    },
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'DAILY_SUMMARY',
    entityName: 'DailySummaryLock',
    entityId: lock.id,
    newValues: { date: lock.date, isLocked: lock.isLocked, notes },
  });

  res.json({ success: true, data: lock });
}
