import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const { search, customerType } = req.query;

  const where: any = { isDeleted: false };
  if (customerType) where.customerType = customerType as string;
  if (search) {
    const q = String(search).trim();
    where.OR = [
      { name: { contains: q } },
      { companyName: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { enquiries: true, quotations: true, orders: true, invoices: true } },
    },
  });

  res.json({ success: true, data: customers });
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const { name, companyName, customerType = 'COMPANY', phone, email, address, city, state, pincode, gstin } = req.body;

  if (!name || !phone) {
    res.status(400).json({ success: false, error: 'Customer name and phone number are required.' });
    return;
  }

  const existing = await prisma.customer.findFirst({
    where: { phone: String(phone).trim(), isDeleted: false },
  });

  const customer = await prisma.customer.create({
    data: {
      name,
      companyName: customerType === 'COMPANY' ? companyName || name : null,
      customerType,
      phone: String(phone).trim(),
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
    module: 'CUSTOMER',
    entityName: 'Customer',
    entityId: customer.id,
    newValues: customer,
  });

  res.status(201).json({
    success: true,
    data: customer,
    warning: existing ? `A customer record with phone ${phone} already existed.` : null,
  });
}
