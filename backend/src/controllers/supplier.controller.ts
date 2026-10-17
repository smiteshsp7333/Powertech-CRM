import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

export async function getSuppliers(req: Request, res: Response): Promise<void> {
  const { search } = req.query;

  const where: any = { isDeleted: false };
  if (search) {
    const q = String(search).trim();
    where.OR = [
      { name: { contains: q } },
      { companyName: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { purchases: true } } },
  });

  res.json({ success: true, data: suppliers });
}

export async function createSupplier(req: Request, res: Response): Promise<void> {
  const { name, companyName, phone, email, address, city, state, pincode, gstin } = req.body;

  if (!name || !phone) {
    res.status(400).json({ success: false, error: 'Supplier name and phone are required.' });
    return;
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      companyName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
    },
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'PURCHASE',
    entityName: 'Supplier',
    entityId: supplier.id,
    newValues: supplier,
  });

  res.status(201).json({ success: true, data: supplier });
}
