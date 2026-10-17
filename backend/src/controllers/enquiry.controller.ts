import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';

export async function getEnquiries(req: Request, res: Response): Promise<void> {
  const {
    search,
    status,
    customerType,
    assignedUserId,
    startDate,
    endDate,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'ENQUIRY');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (status) {
    where.status = status as string;
  }

  if (customerType) {
    where.customerType = customerType as string;
  }

  if (assignedUserId) {
    where.assignedUserId = assignedUserId as string;
  }

  if (startDate || endDate) {
    where.enquiryDate = {};
    if (startDate) where.enquiryDate.gte = new Date(startDate as string);
    if (endDate) where.enquiryDate.lte = new Date(endDate as string);
  }

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { enquiryNumber: { contains: q } },
      { customerName: { contains: q } },
      { phone: { contains: q } },
      { requirements: { contains: q } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { quotations: true, orders: true } },
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

export async function getEnquiryById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedUser: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      quotations: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
      orders: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!enquiry || enquiry.isDeleted) {
    res.status(404).json({ success: false, error: 'Enquiry not found.' });
    return;
  }

  res.json({ success: true, data: enquiry });
}

export async function createEnquiry(req: Request, res: Response): Promise<void> {
  const {
    customerName,
    companyName,
    phone,
    address,
    customerType = 'COMPANY',
    requirements,
    remarks,
    assignedUserId,
    enquiryDate,
  } = req.body;

  if (!customerName || !phone || !requirements) {
    res.status(400).json({
      success: false,
      error: 'Customer name, phone number, and requirements are mandatory.',
    });
    return;
  }

  // Duplicate phone warning check
  const existingWithPhone = await prisma.customer.findFirst({
    where: { phone: String(phone).trim(), isDeleted: false },
  });

  // Create Customer or Link
  let customerId = existingWithPhone?.id;
  if (!customerId) {
    const newCust = await prisma.customer.create({
      data: {
        name: customerName,
        companyName: customerType === 'COMPANY' ? companyName || customerName : null,
        phone: String(phone).trim(),
        address,
        customerType,
      },
    });
    customerId = newCust.id;
  }

  // Atomic sequence generation inside transaction
  const enquiry = await prisma.$transaction(async (tx) => {
    const enquiryNumber = await getNextSequenceNumber({
      module: 'ENQUIRY',
      prefix: 'ENQ',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const created = await tx.enquiry.create({
      data: {
        enquiryNumber,
        enquiryDate: enquiryDate ? new Date(enquiryDate) : new Date(),
        customerId,
        customerType,
        customerName,
        phone: String(phone).trim(),
        address,
        requirements,
        remarks,
        status: 'OPEN',
        assignedUserId: assignedUserId || req.user?.id,
        createdById: req.user!.id,
        timeline: {
          create: {
            action: 'CREATED',
            description: `Enquiry ${enquiryNumber} created.`,
            performedBy: req.user!.name,
          },
        },
      },
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    return created;
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'ENQUIRY',
    entityName: 'Enquiry',
    entityId: enquiry.id,
    newValues: enquiry,
  });

  res.status(201).json({
    success: true,
    data: enquiry,
    warning: existingWithPhone ? `Customer record with phone ${phone} already exists in database.` : null,
  });
}

export async function updateEnquiry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    customerName,
    phone,
    address,
    customerType,
    requirements,
    remarks,
    assignedUserId,
    status,
  } = req.body;

  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Enquiry not found.' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.enquiry.update({
      where: { id },
      data: {
        customerName: customerName ?? existing.customerName,
        phone: phone ?? existing.phone,
        address: address ?? existing.address,
        customerType: customerType ?? existing.customerType,
        requirements: requirements ?? existing.requirements,
        remarks: remarks ?? existing.remarks,
        assignedUserId: assignedUserId ?? existing.assignedUserId,
        status: status ?? existing.status,
      },
    });

    if (status && status !== existing.status) {
      await tx.enquiryTimeline.create({
        data: {
          enquiryId: id,
          action: 'STATUS_CHANGE',
          description: `Status changed from ${existing.status} to ${status}.`,
          performedBy: req.user!.name,
        },
      });
    }

    return result;
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'ENQUIRY',
    entityName: 'Enquiry',
    entityId: id,
    oldValues: existing,
    newValues: updated,
  });

  res.json({ success: true, data: updated });
}

export async function deleteEnquiry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Enquiry not found.' });
    return;
  }

  // Soft delete only!
  await prisma.enquiry.update({
    where: { id },
    data: { isDeleted: true },
  });

  await logAuditEvent({
    req,
    action: 'DELETE',
    module: 'ENQUIRY',
    entityName: 'Enquiry',
    entityId: id,
    oldValues: existing,
  });

  res.json({ success: true, message: 'Enquiry soft-deleted successfully.' });
}
