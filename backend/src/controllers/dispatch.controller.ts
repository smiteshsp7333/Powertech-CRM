import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';
import { notificationService } from '../services/notification.service';

export async function getDispatches(req: Request, res: Response): Promise<void> {
  const {
    search,
    deliveryStatus,
    orderId,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'DISPATCH');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (deliveryStatus) where.deliveryStatus = deliveryStatus as string;
  if (orderId) where.orderId = orderId as string;

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { dispatchNumber: { contains: q } },
      { trackingNumber: { contains: q } },
      { transportCourier: { contains: q } },
      { order: { orderNumber: { contains: q } } },
      { order: { customer: { name: { contains: q } } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.dispatch.count({ where }),
    prisma.dispatch.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        order: { include: { customer: true } },
        items: { include: { orderItem: true } },
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

export async function createDispatch(req: Request, res: Response): Promise<void> {
  const {
    orderId,
    transportCourier,
    trackingNumber,
    deliveryAddress,
    expectedDeliveryDate,
    remarks,
    items = [], // Array of { orderItemId: string, quantity: number }
  } = req.body;

  if (!orderId || !items || items.length === 0) {
    res.status(400).json({ success: false, error: 'Order ID and items are required.' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });

  if (!order || order.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  // Verify dispatched quantity doesn't exceed order quantity
  for (const item of items) {
    const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
    if (!orderItem) {
      res.status(400).json({ success: false, error: `Invalid order item ID: ${item.orderItemId}` });
      return;
    }
    const remainingQty = orderItem.quantity - orderItem.dispatchedQty;
    if (Number(item.quantity) > remainingQty) {
      res.status(400).json({
        success: false,
        error: `Dispatched quantity (${item.quantity}) exceeds remaining quantity (${remainingQty}) for "${orderItem.itemDescription}".`,
      });
      return;
    }
  }

  const dispatch = await prisma.$transaction(async (tx) => {
    const dispatchNumber = await getNextSequenceNumber({
      module: 'DISPATCH',
      prefix: 'DSP',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const created = await tx.dispatch.create({
      data: {
        dispatchNumber,
        orderId,
        transportCourier,
        trackingNumber,
        deliveryAddress: deliveryAddress || order.customer.address,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        deliveryStatus: 'DISPATCHED',
        remarks,
        createdById: req.user!.id,
        items: {
          create: items.map((i: any) => ({
            orderItemId: i.orderItemId,
            quantity: Number(i.quantity),
          })),
        },
      },
      include: {
        items: { include: { orderItem: true } },
      },
    });

    // Update dispatchedQty on order items
    for (const item of items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: { dispatchedQty: { increment: Number(item.quantity) } },
      });
    }

    // Check if entire order is dispatched
    const refreshedOrderItems = await tx.orderItem.findMany({ where: { orderId } });
    const allDispatched = refreshedOrderItems.every((oi) => oi.dispatchedQty >= oi.quantity);
    const newOrderStatus = allDispatched ? 'DISPATCHED' : 'IN_PROGRESS';

    await tx.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus },
    });

    return created;
  });

  // Pluggable notification trigger
  if (dispatch.trackingNumber && order.customer) {
    await notificationService.sendDispatchNotification(
      dispatch.dispatchNumber,
      order.orderNumber,
      order.customer.name,
      order.customer.phone,
      dispatch.trackingNumber,
      dispatch.transportCourier || 'Standard Freight'
    );
  }

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'DISPATCH',
    entityName: 'Dispatch',
    entityId: dispatch.id,
    newValues: dispatch,
  });

  res.status(201).json({ success: true, data: dispatch });
}

export async function updateDeliveryStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { deliveryStatus, actualDeliveryDate, actualDeliveryTime, remarks } = req.body;

  const validStatuses = ['PENDING', 'DISPATCHED', 'DELIVERED', 'DELAYED'];
  if (!validStatuses.includes(deliveryStatus)) {
    res.status(400).json({ success: false, error: 'Invalid delivery status.' });
    return;
  }

  const existing = await prisma.dispatch.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Dispatch not found.' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const d = await tx.dispatch.update({
      where: { id },
      data: {
        deliveryStatus,
        actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : existing.actualDeliveryDate,
        actualDeliveryTime: actualDeliveryTime ?? existing.actualDeliveryTime,
        remarks: remarks ?? existing.remarks,
      },
    });

    // If marked DELIVERED, automatically update parent order status
    if (deliveryStatus === 'DELIVERED') {
      await tx.order.update({
        where: { id: existing.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    return d;
  });

  await logAuditEvent({
    req,
    action: 'STATUS_CHANGE',
    module: 'DISPATCH',
    entityName: 'Dispatch',
    entityId: id,
    oldValues: { deliveryStatus: existing.deliveryStatus },
    newValues: { deliveryStatus: updated.deliveryStatus },
  });

  res.json({ success: true, data: updated });
}

export async function uploadCompletionPhotos(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ success: false, error: 'At least one photograph must be uploaded.' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  const createdPhotos = await Promise.all(
    files.map((file) =>
      prisma.completionPhoto.create({
        data: {
          orderId,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          filePath: `/uploads/${file.filename}`,
          thumbnailUrl: `/uploads/${file.filename}`,
          uploadedById: req.user!.id,
        },
        include: { uploadedBy: { select: { id: true, name: true } } },
      })
    )
  );

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'DISPATCH',
    entityName: 'CompletionPhoto',
    entityId: orderId,
    newValues: { count: createdPhotos.length, files: createdPhotos.map((p) => p.fileName) },
  });

  res.status(201).json({ success: true, data: createdPhotos });
}

export async function deleteCompletionPhoto(req: Request, res: Response): Promise<void> {
  const { photoId } = req.params;
  const { deleteReason } = req.body;

  const photo = await prisma.completionPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.isDeleted) {
    res.status(404).json({ success: false, error: 'Photo not found.' });
    return;
  }

  await prisma.completionPhoto.update({
    where: { id: photoId },
    data: {
      isDeleted: true,
      deletedById: req.user!.id,
      deletedAt: new Date(),
      deleteReason: deleteReason || 'Deleted by authorized staff',
    },
  });

  await logAuditEvent({
    req,
    action: 'DELETE',
    module: 'DISPATCH',
    entityName: 'CompletionPhoto',
    entityId: photoId,
    oldValues: photo,
    newValues: { deleteReason },
  });

  res.json({ success: true, message: 'Completion photo soft-deleted and logged in audit vault.' });
}
