import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import { calculateQuotationTotals } from '../utils/calculations';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';
import { generateQuotationPDF } from '../services/pdf.service';

export async function getQuotations(req: Request, res: Response): Promise<void> {
  const {
    search,
    status,
    enquiryId,
    customerId,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'QUOTATION');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (status) where.status = status as string;
  if (enquiryId) where.enquiryId = enquiryId as string;
  if (customerId) where.customerId = customerId as string;

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { fullNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { companyName: { contains: q } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true } },
        items: true,
        _count: { select: { revisions: true, orders: true } },
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

export async function getQuotationById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      enquiry: true,
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      revisions: { orderBy: { revisionNumber: 'desc' } },
      orders: { where: { isDeleted: false } },
    },
  });

  if (!quotation || quotation.isDeleted) {
    res.status(404).json({ success: false, error: 'Quotation not found.' });
    return;
  }

  res.json({ success: true, data: quotation });
}

export async function createQuotation(req: Request, res: Response): Promise<void> {
  const {
    enquiryId,
    customerId,
    quotationDate,
    validUntil,
    items = [],
    discountType = 'PERCENT',
    discountValue = 0,
    taxRate = 18,
    specificationNotes,
    termsAndConditions,
  } = req.body;

  if (!customerId || !items || items.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Customer and at least one line item are required.',
    });
    return;
  }

  const calculated = calculateQuotationTotals({
    items: items.map((i: any) => ({
      quantity: Number(i.quantity) || 1,
      rate: Number(i.rate) || 0,
    })),
    discountType,
    discountValue: Number(discountValue) || 0,
    taxRate: Number(taxRate) || 0,
  });

  const quotation = await prisma.$transaction(async (tx) => {
    const quotationNumber = await getNextSequenceNumber({
      module: 'QUOTATION',
      prefix: 'QTN',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const created = await tx.quotation.create({
      data: {
        quotationNumber,
        revisionNumber: 0,
        fullNumber: quotationNumber,
        enquiryId: enquiryId || null,
        customerId,
        quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal: calculated.subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmount: calculated.discountAmount,
        taxRate: Number(taxRate) || 0,
        taxAmount: calculated.taxAmount,
        totalAmount: calculated.totalAmount,
        specificationNotes,
        termsAndConditions,
        status: 'DRAFT',
        createdById: req.user!.id,
        items: {
          create: items.map((item: any, idx: number) => ({
            itemDescription: item.itemDescription,
            specification: item.specification || null,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'Nos',
            rate: Number(item.rate) || 0,
            amount: Math.round(((Number(item.quantity) || 1) * (Number(item.rate) || 0)) * 100) / 100,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Auto-update linked enquiry status
    if (enquiryId) {
      await tx.enquiry.update({
        where: { id: enquiryId },
        data: { status: 'QUOTATION_PREPARED' },
      });
      await tx.enquiryTimeline.create({
        data: {
          enquiryId,
          action: 'QUOTATION_CREATED',
          description: `Quotation ${quotationNumber} generated.`,
          performedBy: req.user!.name,
        },
      });
    }

    return created;
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'QUOTATION',
    entityName: 'Quotation',
    entityId: quotation.id,
    newValues: quotation,
  });

  res.status(201).json({ success: true, data: quotation });
}

export async function createRevisionOrUpdate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    items = [],
    discountType = 'PERCENT',
    discountValue = 0,
    taxRate = 18,
    specificationNotes,
    termsAndConditions,
    status,
    revisionReason,
  } = req.body;

  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Quotation not found.' });
    return;
  }

  // If already converted to order, block modification
  if (existing.status === 'CONVERTED_TO_ORDER') {
    res.status(400).json({
      success: false,
      error: 'Cannot modify a quotation that has already been converted to an order.',
    });
    return;
  }

  const calculated = calculateQuotationTotals({
    items: items.map((i: any) => ({
      quantity: Number(i.quantity) || 1,
      rate: Number(i.rate) || 0,
    })),
    discountType,
    discountValue: Number(discountValue) || 0,
    taxRate: Number(taxRate) || 0,
  });

  const updated = await prisma.$transaction(async (tx) => {
    // If the quotation was already issued/sent, create a revision snapshot and increment revision number
    const isIssued = existing.status !== 'DRAFT';
    const nextRevNumber = isIssued ? existing.revisionNumber + 1 : existing.revisionNumber;
    const newFullNumber = isIssued
      ? `${existing.quotationNumber}-R${nextRevNumber}`
      : existing.fullNumber;

    if (isIssued) {
      await tx.quotationRevision.create({
        data: {
          quotationId: id,
          revisionNumber: existing.revisionNumber,
          fullNumber: existing.fullNumber,
          snapshotData: JSON.stringify(existing),
          reason: revisionReason || 'Specification / Commercial modification',
          createdById: req.user!.id,
        },
      });
    }

    // Replace items
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });

    const updatedQuotation = await tx.quotation.update({
      where: { id },
      data: {
        revisionNumber: nextRevNumber,
        fullNumber: newFullNumber,
        subtotal: calculated.subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmount: calculated.discountAmount,
        taxRate: Number(taxRate) || 0,
        taxAmount: calculated.taxAmount,
        totalAmount: calculated.totalAmount,
        specificationNotes: specificationNotes ?? existing.specificationNotes,
        termsAndConditions: termsAndConditions ?? existing.termsAndConditions,
        status: status ?? existing.status,
        items: {
          create: items.map((item: any, idx: number) => ({
            itemDescription: item.itemDescription,
            specification: item.specification || null,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'Nos',
            rate: Number(item.rate) || 0,
            amount: Math.round(((Number(item.quantity) || 1) * (Number(item.rate) || 0)) * 100) / 100,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
        revisions: true,
      },
    });

    return updatedQuotation;
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'QUOTATION',
    entityName: 'Quotation',
    entityId: id,
    oldValues: existing,
    newValues: updated,
  });

  res.json({ success: true, data: updated });
}

export async function convertToOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { agreedPaymentTerms, dueDays = 30 } = req.body;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });

  if (!quotation || quotation.isDeleted) {
    res.status(404).json({ success: false, error: 'Quotation not found.' });
    return;
  }

  if (quotation.status === 'CONVERTED_TO_ORDER') {
    res.status(400).json({ success: false, error: 'Quotation has already been converted to an order.' });
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
        enquiryId: quotation.enquiryId,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        subtotal: quotation.subtotal,
        discountAmount: quotation.discountAmount,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        agreedPaymentTerms: agreedPaymentTerms || '30 days net',
        dueDays: Number(dueDays) || 30,
        status: 'PLACED',
        createdById: req.user!.id,
        items: {
          create: quotation.items.map((item, idx) => ({
            itemDescription: item.itemDescription,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
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

    // Mark quotation converted
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: 'CONVERTED_TO_ORDER' },
    });

    // Update enquiry if exists
    if (quotation.enquiryId) {
      await tx.enquiry.update({
        where: { id: quotation.enquiryId },
        data: { status: 'ORDER_PLACED' },
      });
      await tx.enquiryTimeline.create({
        data: {
          enquiryId: quotation.enquiryId,
          action: 'ORDER_PLACED',
          description: `Order ${orderNumber} placed from Quotation ${quotation.fullNumber}.`,
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
    newValues: { orderNumber: order.orderNumber, fromQuotation: quotation.fullNumber },
  });

  res.status(201).json({ success: true, data: order });
}

export async function downloadQuotationPdf(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!quotation || quotation.isDeleted) {
    res.status(404).json({ success: false, error: 'Quotation not found.' });
    return;
  }

  const settingsList = await prisma.setting.findMany();
  const settingsMap = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const pdfBuffer = await generateQuotationPDF({
    fullNumber: quotation.fullNumber,
    quotationDate: quotation.quotationDate,
    validUntil: quotation.validUntil,
    customerName: quotation.customer.name,
    companyName: quotation.customer.companyName,
    phone: quotation.customer.phone,
    address: quotation.customer.address,
    gstin: quotation.customer.gstin,
    items: quotation.items,
    subtotal: quotation.subtotal,
    discountAmount: quotation.discountAmount,
    taxAmount: quotation.taxAmount,
    totalAmount: quotation.totalAmount,
    specificationNotes: quotation.specificationNotes,
    termsAndConditions: quotation.termsAndConditions,
    companySettings: settingsMap,
  });

  await logAuditEvent({
    req,
    action: 'EXPORT',
    module: 'QUOTATION',
    entityName: 'Quotation',
    entityId: id,
    newValues: { format: 'PDF', fullNumber: quotation.fullNumber },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${quotation.fullNumber}.pdf"`);
  res.send(pdfBuffer);
}

export async function deleteQuotation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    res.status(404).json({ success: false, error: 'Quotation not found.' });
    return;
  }

  await prisma.quotation.update({
    where: { id },
    data: { isDeleted: true },
  });

  await logAuditEvent({
    req,
    action: 'DELETE',
    module: 'QUOTATION',
    entityName: 'Quotation',
    entityId: id,
    oldValues: existing,
  });

  res.json({ success: true, message: 'Quotation soft-deleted successfully.' });
}
