import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import { round2 } from '../utils/calculations';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';

export async function getPurchases(req: Request, res: Response): Promise<void> {
  const {
    search,
    supplierId,
    startDate,
    endDate,
    page = '1',
    limit = '10',
    sortBy = 'purchaseDate',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'PURCHASE');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (supplierId) where.supplierId = supplierId as string;

  if (startDate || endDate) {
    where.purchaseDate = {};
    if (startDate) where.purchaseDate.gte = new Date(startDate as string);
    if (endDate) where.purchaseDate.lte = new Date(endDate as string);
  }

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { purchaseNumber: { contains: q } },
      { description: { contains: q } },
      { supplierBillNo: { contains: q } },
      { supplier: { name: { contains: q } } },
      { supplier: { companyName: { contains: q } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function createPurchase(req: Request, res: Response): Promise<void> {
  const {
    supplierId,
    supplierBillNo,
    description,
    category,
    subtotal = 0,
    taxRate = 18,
    purchaseDate,
    billAttachmentPath,
  } = req.body;

  if (!supplierId || !description || Number(subtotal) <= 0) {
    res.status(400).json({ success: false, error: 'Supplier, description, and positive subtotal amount are required.' });
    return;
  }

  const sub = round2(Number(subtotal));
  const rate = round2(Number(taxRate));
  const tax = round2((sub * rate) / 100);
  const total = round2(sub + tax);

  const purchase = await prisma.$transaction(async (tx) => {
    const purchaseNumber = await getNextSequenceNumber({
      module: 'PURCHASE',
      prefix: 'PUR',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const created = await tx.purchase.create({
      data: {
        purchaseNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        supplierId,
        supplierBillNo,
        description,
        category: category || 'RAW_MATERIAL',
        subtotal: sub,
        taxRate: rate,
        taxAmount: tax,
        totalAmount: total,
        paymentStatus: 'PENDING',
        billAttachmentPath,
        createdById: req.user!.id,
      },
      include: {
        supplier: true,
      },
    });

    return created;
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'PURCHASE',
    entityName: 'Purchase',
    entityId: purchase.id,
    newValues: purchase,
  });

  res.status(201).json({ success: true, data: purchase });
}

export async function deletePurchase(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Purchase record not found.' });
    return;
  }

  await prisma.purchase.update({
    where: { id },
    data: { isDeleted: true },
  });

  await logAuditEvent({
    req,
    action: 'DELETE',
    module: 'PURCHASE',
    entityName: 'Purchase',
    entityId: id,
    oldValues: existing,
  });

  res.json({ success: true, message: 'Purchase soft-deleted successfully.' });
}
