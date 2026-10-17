import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';

export async function getOrders(req: Request, res: Response): Promise<void> {
  const {
    search,
    status,
    customerId,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'ORDER');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (status) where.status = status as string;
  if (customerId) where.customerId = customerId as string;

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { orderNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { companyName: { contains: q } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true } },
        items: true,
        _count: { select: { dispatches: true, invoices: true, completionPhotos: true } },
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

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      enquiry: true,
      quotation: true,
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      dispatches: {
        where: { isDeleted: false },
        include: { items: { include: { orderItem: true } }, createdBy: { select: { id: true, name: true } } },
      },
      invoices: {
        where: { isDeleted: false },
        include: { payments: { where: { isDeleted: false } }, items: true },
      },
      completionPhotos: {
        where: { isDeleted: false },
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!order || order.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  res.json({ success: true, data: order });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const {
    enquiryId,
    customerId,
    items = [],
    subtotal = 0,
    discountAmount = 0,
    taxAmount = 0,
    totalAmount = 0,
    agreedPaymentTerms,
    dueDays = 30,
    orderDate,
  } = req.body;

  if (!customerId || !items || items.length === 0) {
    res.status(400).json({ success: false, error: 'Customer and items are required.' });
    return;
  }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await getNextSequenceNumber({
      module: 'ORDER',
      prefix: 'ORD',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        enquiryId: enquiryId || null,
        customerId,
        subtotal: Number(subtotal) || 0,
        discountAmount: Number(discountAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        totalAmount: Number(totalAmount) || 0,
        agreedPaymentTerms: agreedPaymentTerms || '30 days net',
        dueDays: Number(dueDays) || 30,
        status: 'PLACED',
        createdById: req.user!.id,
        items: {
          create: items.map((item: any, idx: number) => ({
            itemDescription: item.itemDescription,
            specification: item.specification || null,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'Nos',
            rate: Number(item.rate) || 0,
            amount: Math.round(((Number(item.quantity) || 1) * (Number(item.rate) || 0)) * 100) / 100,
            dispatchedQty: 0,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (enquiryId) {
      await tx.enquiry.update({
        where: { id: enquiryId },
        data: { status: 'ORDER_PLACED' },
      });
      await tx.enquiryTimeline.create({
        data: {
          enquiryId,
          action: 'ORDER_PLACED',
          description: `Direct Order ${orderNumber} placed.`,
          performedBy: req.user!.name,
        },
      });
    }

    return newOrder;
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'ORDER',
    entityName: 'Order',
    entityId: order.id,
    newValues: order,
  });

  res.status(201).json({ success: true, data: order });
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  const validStatuses = [
    'PLACED',
    'CONFIRMED',
    'IN_PROGRESS',
    'READY_FOR_DISPATCH',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid order status provided.' });
    return;
  }

  if (status === 'CANCELLED' && !cancellationReason) {
    res.status(400).json({
      success: false,
      error: 'Cancellation reason is mandatory when cancelling an order.',
    });
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      cancellationReason: status === 'CANCELLED' ? cancellationReason : existing.cancellationReason,
      cancelledAt: status === 'CANCELLED' ? new Date() : existing.cancelledAt,
      cancelledById: status === 'CANCELLED' ? req.user!.id : existing.cancelledById,
    },
  });

  await logAuditEvent({
    req,
    action: 'STATUS_CHANGE',
    module: 'ORDER',
    entityName: 'Order',
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status: updated.status, cancellationReason },
  });

  res.json({ success: true, data: updated });
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  await prisma.order.update({
    where: { id },
    data: { isDeleted: true },
  });

  await logAuditEvent({
    req,
    action: 'DELETE',
    module: 'ORDER',
    entityName: 'Order',
    entityId: id,
    oldValues: existing,
  });

  res.json({ success: true, message: 'Order soft-deleted successfully.' });
}
