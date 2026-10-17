import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { round2 } from '../utils/calculations';
import { generateExcelReport } from '../services/excel.service';
import { logAuditEvent } from '../utils/audit';
import { getScopeFilter } from '../middleware/rbac';

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  const user = req.user;

  const [
    totalEnquiries,
    totalQuotations,
    confirmedOrders,
    pendingDispatches,
    pendingDeliveries,
    unpaidInvoices,
    invoicesAggregate,
    paymentsAggregate,
    purchasesAggregate,
    recentOrders,
    recentEnquiries,
  ] = await Promise.all([
    prisma.enquiry.count({ where: { isDeleted: false, ...getScopeFilter(user, 'ENQUIRY') } }),
    prisma.quotation.count({ where: { isDeleted: false, ...getScopeFilter(user, 'QUOTATION') } }),
    prisma.order.count({
      where: {
        isDeleted: false,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY_FOR_DISPATCH'] },
        ...getScopeFilter(user, 'ORDER'),
      },
    }),
    prisma.dispatch.count({
      where: {
        isDeleted: false,
        deliveryStatus: { in: ['PENDING', 'DISPATCHED'] },
        ...getScopeFilter(user, 'DISPATCH'),
      },
    }),
    prisma.order.count({
      where: {
        isDeleted: false,
        status: 'DISPATCHED',
        ...getScopeFilter(user, 'ORDER'),
      },
    }),
    prisma.invoice.aggregate({
      where: {
        isDeleted: false,
        balanceAmount: { gt: 0 },
        ...getScopeFilter(user, 'BILLING'),
      },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { isDeleted: false, ...getScopeFilter(user, 'BILLING') },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { isDeleted: false },
      _sum: { amountReceived: true },
    }),
    prisma.purchase.aggregate({
      where: { isDeleted: false, ...getScopeFilter(user, 'PURCHASE') },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { isDeleted: false, ...getScopeFilter(user, 'ORDER') },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.enquiry.findMany({
      where: { isDeleted: false, ...getScopeFilter(user, 'ENQUIRY') },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Enquiry Funnel
  const [openEnquiries, quotePrepEnquiries, orderPlacedEnquiries, lostEnquiries] = await Promise.all([
    prisma.enquiry.count({ where: { status: 'OPEN', isDeleted: false } }),
    prisma.enquiry.count({ where: { status: 'QUOTATION_PREPARED', isDeleted: false } }),
    prisma.enquiry.count({ where: { status: 'ORDER_PLACED', isDeleted: false } }),
    prisma.enquiry.count({ where: { status: 'CLOSED_LOST', isDeleted: false } }),
  ]);

  // Monthly Billing vs Collection Trend (last 6 months)
  const monthlyData: { month: string; billing: number; collection: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    const [mInv, mPay] = await Promise.all([
      prisma.invoice.aggregate({
        where: { isDeleted: false, billingDate: { gte: mStart, lte: mEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { isDeleted: false, paymentDate: { gte: mStart, lte: mEnd } },
        _sum: { amountReceived: true },
      }),
    ]);

    monthlyData.push({
      month: label,
      billing: round2(mInv._sum.totalAmount || 0),
      collection: round2(mPay._sum.amountReceived || 0),
    });
  }

  res.json({
    success: true,
    data: {
      cards: {
        totalEnquiries,
        totalQuotations,
        confirmedOrders,
        pendingDispatches,
        pendingDeliveries,
        pendingPaymentsCount: unpaidInvoices._count,
        pendingPaymentsAmount: round2(unpaidInvoices._sum.balanceAmount || 0),
        totalBilling: round2(invoicesAggregate._sum.totalAmount || 0),
        totalCollections: round2(paymentsAggregate._sum.amountReceived || 0),
        totalPurchases: round2(purchasesAggregate._sum.totalAmount || 0),
      },
      enquiryFunnel: [
        { stage: 'Open Enquiries', count: openEnquiries, color: '#2563eb' },
        { stage: 'Quotation Prepared', count: quotePrepEnquiries, color: '#7c3aed' },
        { stage: 'Order Placed', count: orderPlacedEnquiries, color: '#16a34a' },
        { stage: 'Closed / Lost', count: lostEnquiries, color: '#dc2626' },
      ],
      monthlyTrend: monthlyData,
      recentOrders,
      recentEnquiries,
    },
  });
}

export async function getReportData(req: Request, res: Response): Promise<void> {
  const { reportType, startDate, endDate, status, customerId, format } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  let reportTitle = 'Report';
  let columns: { header: string; key: string; width: number }[] = [];
  let rows: any[] = [];

  switch (reportType) {
    case 'ENQUIRY': {
      reportTitle = 'Enquiry Register Report';
      columns = [
        { header: 'Enquiry No', key: 'enquiryNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Phone', key: 'phone', width: 16 },
        { header: 'Type', key: 'customerType', width: 14 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Assigned User', key: 'assignedUser', width: 20 },
      ];
      const items = await prisma.enquiry.findMany({
        where: {
          isDeleted: false,
          enquiryDate: { gte: start, lte: end },
          ...(status ? { status: status as string } : {}),
        },
        include: { assignedUser: true },
        orderBy: { enquiryDate: 'desc' },
      });
      rows = items.map((i) => ({
        enquiryNumber: i.enquiryNumber,
        date: i.enquiryDate.toISOString().slice(0, 10),
        customerName: i.customerName,
        phone: i.phone,
        customerType: i.customerType,
        status: i.status,
        assignedUser: i.assignedUser?.name || 'Unassigned',
      }));
      break;
    }

    case 'QUOTATION': {
      reportTitle = 'Quotation Summary Report';
      columns = [
        { header: 'Quotation No', key: 'fullNumber', width: 20 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Subtotal (INR)', key: 'subtotal', width: 16 },
        { header: 'Tax (INR)', key: 'taxAmount', width: 16 },
        { header: 'Total Amount (INR)', key: 'totalAmount', width: 18 },
        { header: 'Status', key: 'status', width: 18 },
      ];
      const items = await prisma.quotation.findMany({
        where: {
          isDeleted: false,
          quotationDate: { gte: start, lte: end },
          ...(status ? { status: status as string } : {}),
        },
        include: { customer: true },
        orderBy: { quotationDate: 'desc' },
      });
      rows = items.map((i) => ({
        fullNumber: i.fullNumber,
        date: i.quotationDate.toISOString().slice(0, 10),
        customerName: i.customer.name,
        subtotal: i.subtotal,
        taxAmount: i.taxAmount,
        totalAmount: i.totalAmount,
        status: i.status,
      }));
      break;
    }

    case 'ORDER': {
      reportTitle = 'Order Register Report';
      columns = [
        { header: 'Order No', key: 'orderNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Total Value (INR)', key: 'totalAmount', width: 18 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Agreed Terms', key: 'terms', width: 25 },
      ];
      const items = await prisma.order.findMany({
        where: {
          isDeleted: false,
          orderDate: { gte: start, lte: end },
          ...(status ? { status: status as string } : {}),
        },
        include: { customer: true },
        orderBy: { orderDate: 'desc' },
      });
      rows = items.map((i) => ({
        orderNumber: i.orderNumber,
        date: i.orderDate.toISOString().slice(0, 10),
        customerName: i.customer.name,
        totalAmount: i.totalAmount,
        status: i.status,
        terms: i.agreedPaymentTerms || '-',
      }));
      break;
    }

    case 'DISPATCH': {
      reportTitle = 'Dispatch & Delivery Log';
      columns = [
        { header: 'Dispatch No', key: 'dispatchNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Order Ref', key: 'orderNumber', width: 18 },
        { header: 'Courier / Transport', key: 'courier', width: 22 },
        { header: 'Tracking No', key: 'tracking', width: 20 },
        { header: 'Delivery Status', key: 'status', width: 16 },
      ];
      const items = await prisma.dispatch.findMany({
        where: {
          isDeleted: false,
          dispatchDate: { gte: start, lte: end },
          ...(status ? { deliveryStatus: status as string } : {}),
        },
        include: { order: true },
        orderBy: { dispatchDate: 'desc' },
      });
      rows = items.map((i) => ({
        dispatchNumber: i.dispatchNumber,
        date: i.dispatchDate.toISOString().slice(0, 10),
        orderNumber: i.order.orderNumber,
        courier: i.transportCourier || '-',
        tracking: i.trackingNumber || '-',
        status: i.deliveryStatus,
      }));
      break;
    }

    case 'BILLING': {
      reportTitle = 'Billing & Sales Register';
      columns = [
        { header: 'Invoice No', key: 'invoiceNumber', width: 20 },
        { header: 'Billing Date', key: 'date', width: 14 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Taxable Amount', key: 'taxable', width: 16 },
        { header: 'Total GST', key: 'tax', width: 14 },
        { header: 'Invoice Total', key: 'total', width: 16 },
        { header: 'Amount Received', key: 'received', width: 16 },
        { header: 'Balance Due', key: 'balance', width: 16 },
        { header: 'Payment Status', key: 'status', width: 16 },
      ];
      const items = await prisma.invoice.findMany({
        where: {
          isDeleted: false,
          billingDate: { gte: start, lte: end },
          ...(status ? { paymentStatus: status as string } : {}),
        },
        include: { customer: true },
        orderBy: { billingDate: 'desc' },
      });
      rows = items.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        date: i.billingDate.toISOString().slice(0, 10),
        customerName: i.customer.name,
        taxable: i.subtotal,
        tax: i.taxAmount,
        total: i.totalAmount,
        received: i.amountReceived,
        balance: i.balanceAmount,
        status: i.paymentStatus,
      }));
      break;
    }

    case 'PAYMENTS': {
      reportTitle = 'Collections & Payment Receipts';
      columns = [
        { header: 'Receipt No', key: 'receiptNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Invoice Ref', key: 'invoiceNumber', width: 20 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Mode', key: 'mode', width: 16 },
        { header: 'Ref / Cheque No', key: 'reference', width: 20 },
        { header: 'Amount Received', key: 'amount', width: 18 },
      ];
      const items = await prisma.payment.findMany({
        where: {
          isDeleted: false,
          paymentDate: { gte: start, lte: end },
        },
        include: { invoice: { include: { customer: true } } },
        orderBy: { paymentDate: 'desc' },
      });
      rows = items.map((i) => ({
        receiptNumber: i.receiptNumber,
        date: i.paymentDate.toISOString().slice(0, 10),
        invoiceNumber: i.invoice.invoiceNumber,
        customerName: i.invoice.customer.name,
        mode: i.paymentMode,
        reference: i.referenceNumber || '-',
        amount: i.amountReceived,
      }));
      break;
    }

    case 'PURCHASE': {
      reportTitle = 'Procurement & Purchase Register';
      columns = [
        { header: 'Purchase No', key: 'purchaseNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Supplier', key: 'supplierName', width: 25 },
        { header: 'Supplier Bill No', key: 'billNo', width: 18 },
        { header: 'Description', key: 'desc', width: 25 },
        { header: 'Total Amount', key: 'amount', width: 18 },
        { header: 'Payment Status', key: 'status', width: 16 },
      ];
      const items = await prisma.purchase.findMany({
        where: {
          isDeleted: false,
          purchaseDate: { gte: start, lte: end },
        },
        include: { supplier: true },
        orderBy: { purchaseDate: 'desc' },
      });
      rows = items.map((i) => ({
        purchaseNumber: i.purchaseNumber,
        date: i.purchaseDate.toISOString().slice(0, 10),
        supplierName: i.supplier.name,
        billNo: i.supplierBillNo || '-',
        desc: i.description,
        amount: i.totalAmount,
        status: i.paymentStatus,
      }));
      break;
    }

    default:
      res.status(400).json({ success: false, error: 'Invalid reportType specified.' });
      return;
  }

  // Handle Excel Export
  if (format === 'excel') {
    const buffer = await generateExcelReport(reportTitle, columns, rows);
    await logAuditEvent({
      req,
      action: 'EXPORT',
      module: 'REPORT',
      entityName: 'Report',
      entityId: String(reportType),
      newValues: { format: 'EXCEL', reportType },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_Report.xlsx"`);
    res.send(buffer);
    return;
  }

  res.json({
    success: true,
    data: {
      reportTitle,
      columns,
      rows,
      count: rows.length,
    },
  });
}
