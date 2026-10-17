import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getNextSequenceNumber } from '../utils/sequence';
import {
  calculateInvoiceTaxes,
  calculateInvoiceBalance,
  calculateAgeingBucket,
  round2,
} from '../utils/calculations';
import { getScopeFilter } from '../middleware/rbac';
import { logAuditEvent } from '../utils/audit';
import { generateInvoicePDF } from '../services/pdf.service';

export async function getInvoices(req: Request, res: Response): Promise<void> {
  const {
    search,
    paymentStatus,
    customerId,
    orderId,
    page = '1',
    limit = '10',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const scopeFilter = getScopeFilter(req.user, 'BILLING');

  const where: any = {
    isDeleted: false,
    ...scopeFilter,
  };

  if (paymentStatus) where.paymentStatus = paymentStatus as string;
  if (customerId) where.customerId = customerId as string;
  if (orderId) where.orderId = orderId as string;

  if (search) {
    const q = String(search).trim();
    where.OR = [
      { invoiceNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { companyName: { contains: q } } },
      { order: { orderNumber: { contains: q } } },
    ];
  }

  const [total, rawInvoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        customer: true,
        order: { select: { id: true, orderNumber: true } },
        createdBy: { select: { id: true, name: true } },
        payments: { where: { isDeleted: false } },
        _count: { select: { items: true, payments: true } },
      },
    }),
  ]);

  // Dynamically compute real-time ageing and balances
  const now = new Date();
  const data = rawInvoices.map((inv) => {
    const balanceCalc = calculateInvoiceBalance(
      inv.totalAmount,
      inv.amountReceived,
      inv.creditNoteAmount,
      inv.dueDate,
      now
    );
    const ageingBucket = calculateAgeingBucket(inv.dueDate, now);
    return {
      ...inv,
      paymentStatus: balanceCalc.paymentStatus,
      balanceAmount: balanceCalc.balanceAmount,
      ageingBucket,
    };
  });

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

export async function getPendingPayments(req: Request, res: Response): Promise<void> {
  const scopeFilter = getScopeFilter(req.user, 'BILLING');

  const invoices = await prisma.invoice.findMany({
    where: {
      isDeleted: false,
      balanceAmount: { gt: 0 },
      ...scopeFilter,
    },
    include: {
      customer: true,
      order: { select: { id: true, orderNumber: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const now = new Date();
  const ageingSummary = {
    '0-30 days': { count: 0, amount: 0 },
    '31-60 days': { count: 0, amount: 0 },
    '61-90 days': { count: 0, amount: 0 },
    '90+ days': { count: 0, amount: 0 },
  };

  let totalOutstanding = 0;

  const list = invoices.map((inv) => {
    const ageing = calculateAgeingBucket(inv.dueDate, now);
    const balance = inv.balanceAmount;
    totalOutstanding += balance;

    ageingSummary[ageing].count += 1;
    ageingSummary[ageing].amount = round2(ageingSummary[ageing].amount + balance);

    return {
      ...inv,
      ageingBucket: ageing,
    };
  });

  res.json({
    success: true,
    data: {
      totalOutstanding: round2(totalOutstanding),
      ageingSummary,
      invoices: list,
    },
  });
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  const {
    orderId,
    invoiceType = 'SYSTEM_GENERATED', // 'SYSTEM_GENERATED' or 'RECORDED_EXTERNAL'
    externalInvoiceNumber,
    billingDate,
    dueDate,
    items = [],
    discountAmount = 0,
    isInterState = false,
    gstRate = 18,
    paymentTerms,
    placeOfSupply,
  } = req.body;

  if (!orderId || !items || items.length === 0) {
    res.status(400).json({ success: false, error: 'Order ID and items are required.' });
    return;
  }

  if (invoiceType === 'RECORDED_EXTERNAL' && !externalInvoiceNumber) {
    res.status(400).json({ success: false, error: 'Invoice number is required for recorded external invoice.' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });

  if (!order || order.isDeleted) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  // Calculate Subtotal & GST
  const subtotal = round2(
    items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1) * (Number(it.rate) || 0), 0)
  );

  const taxes = calculateInvoiceTaxes({
    subtotal,
    discountAmount: Number(discountAmount) || 0,
    isInterState: Boolean(isInterState),
    gstRate: Number(gstRate) || 18,
  });

  const invoice = await prisma.$transaction(async (tx) => {
    let invoiceNumber = externalInvoiceNumber;
    if (invoiceType === 'SYSTEM_GENERATED') {
      invoiceNumber = await getNextSequenceNumber({
        module: 'INVOICE',
        prefix: 'INV',
        yearFormat: 'FINANCIAL_YEAR',
        padding: 5,
        tx,
      });
    }

    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        invoiceType,
        orderId,
        customerId: order.customerId,
        customerGstin: order.customer.gstin,
        placeOfSupply: placeOfSupply || (isInterState ? 'Inter-State' : 'Intra-State (Local)'),
        billingDate: billingDate ? new Date(billingDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + (order.dueDays || 30) * 24 * 60 * 60 * 1000),
        subtotal: taxes.taxableAmount,
        discountAmount: Number(discountAmount) || 0,
        cgstRate: taxes.cgstRate,
        cgstAmount: taxes.cgstAmount,
        sgstRate: taxes.sgstRate,
        sgstAmount: taxes.sgstAmount,
        igstRate: taxes.igstRate,
        igstAmount: taxes.igstAmount,
        taxAmount: taxes.taxAmount,
        totalAmount: taxes.totalAmount,
        amountReceived: 0,
        balanceAmount: taxes.totalAmount,
        paymentStatus: 'UNPAID',
        paymentTerms: paymentTerms || order.agreedPaymentTerms,
        isLocked: true, // Issued invoices are locked by default
        createdById: req.user!.id,
        items: {
          create: items.map((it: any) => ({
            itemDescription: it.itemDescription,
            hsnSacCode: it.hsnSacCode || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'Nos',
            rate: Number(it.rate) || 0,
            amount: round2((Number(it.quantity) || 1) * (Number(it.rate) || 0)),
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return created;
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'BILLING',
    entityName: 'Invoice',
    entityId: invoice.id,
    newValues: invoice,
  });

  res.status(201).json({ success: true, data: invoice });
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  const { invoiceId } = req.params;
  const {
    amountReceived,
    paymentMode,
    paymentDate,
    referenceNumber,
    bankName,
    remarks,
  } = req.body;

  const paymentAmt = round2(Number(amountReceived));
  if (!paymentAmt || paymentAmt <= 0) {
    res.status(400).json({ success: false, error: 'A positive payment amount is required.' });
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { where: { isDeleted: false } } },
  });

  if (!invoice || invoice.isDeleted) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  // Overpayment check
  const currentTotalReceived = invoice.amountReceived;
  const maxAllowable = round2(invoice.totalAmount - currentTotalReceived - invoice.creditNoteAmount);

  if (paymentAmt > maxAllowable) {
    res.status(400).json({
      success: false,
      error: `Payment amount (INR ${paymentAmt}) exceeds current balance due (INR ${maxAllowable}). Overpayment is blocked.`,
    });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const receiptNumber = await getNextSequenceNumber({
      module: 'PAYMENT',
      prefix: 'REC',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
      tx,
    });

    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        invoiceId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode: paymentMode || 'BANK_TRANSFER',
        amountReceived: paymentAmt,
        referenceNumber,
        bankName,
        remarks,
        receivedById: req.user!.id,
      },
    });

    const newReceived = round2(currentTotalReceived + paymentAmt);
    const balanceCalc = calculateInvoiceBalance(
      invoice.totalAmount,
      newReceived,
      invoice.creditNoteAmount,
      invoice.dueDate
    );

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountReceived: newReceived,
        balanceAmount: balanceCalc.balanceAmount,
        paymentStatus: balanceCalc.paymentStatus,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  await logAuditEvent({
    req,
    action: 'CREATE',
    module: 'BILLING',
    entityName: 'Payment',
    entityId: result.payment.id,
    newValues: result.payment,
  });

  res.status(201).json({ success: true, data: result });
}

export async function addCreditNote(req: Request, res: Response): Promise<void> {
  const { invoiceId } = req.params;
  const { creditNoteAmount, reason } = req.body;

  const creditAmt = round2(Number(creditNoteAmount));
  if (!creditAmt || creditAmt <= 0) {
    res.status(400).json({ success: false, error: 'Positive credit note amount is required.' });
    return;
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.isDeleted) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  const currentSettled = round2(invoice.amountReceived + invoice.creditNoteAmount);
  if (creditAmt > round2(invoice.totalAmount - currentSettled)) {
    res.status(400).json({ success: false, error: 'Credit note amount exceeds remaining invoice balance.' });
    return;
  }

  const newCreditTotal = round2(invoice.creditNoteAmount + creditAmt);
  const balanceCalc = calculateInvoiceBalance(
    invoice.totalAmount,
    invoice.amountReceived,
    newCreditTotal,
    invoice.dueDate
  );

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      creditNoteAmount: newCreditTotal,
      creditNoteReason: reason || 'Commercial adjustment',
      balanceAmount: balanceCalc.balanceAmount,
      paymentStatus: balanceCalc.paymentStatus,
    },
  });

  await logAuditEvent({
    req,
    action: 'UPDATE',
    module: 'BILLING',
    entityName: 'InvoiceCreditNote',
    entityId: invoiceId,
    newValues: { creditNoteAmount: creditAmt, reason, newBalance: balanceCalc.balanceAmount },
  });

  res.json({ success: true, data: updated });
}

export async function downloadInvoicePdf(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      order: true,
      items: true,
    },
  });

  if (!invoice || invoice.isDeleted) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  const settingsList = await prisma.setting.findMany();
  const settingsMap = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    billingDate: invoice.billingDate,
    dueDate: invoice.dueDate,
    orderNumber: invoice.order?.orderNumber,
    customerName: invoice.customer.name,
    companyName: invoice.customer.companyName,
    phone: invoice.customer.phone,
    address: invoice.customer.address,
    customerGstin: invoice.customerGstin,
    placeOfSupply: invoice.placeOfSupply,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    igstAmount: invoice.igstAmount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    amountReceived: invoice.amountReceived,
    balanceAmount: invoice.balanceAmount,
    paymentStatus: invoice.paymentStatus,
    companySettings: settingsMap,
  });

  await logAuditEvent({
    req,
    action: 'EXPORT',
    module: 'BILLING',
    entityName: 'Invoice',
    entityId: id,
    newValues: { format: 'PDF', invoiceNumber: invoice.invoiceNumber },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
}
