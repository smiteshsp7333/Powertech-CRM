import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatCurrency(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return new Date().toLocaleDateString('en-IN');
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN');
  } catch {
    return dateStr;
  }
}

export function generateQuotationPdf(quotation: any): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('POWERTECH SOLUTIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Industrial Laser Processing | Precision Sheet Metal | PVD Coating', 14, 17);
  doc.text('Plot 45, MIDC Industrial Area, Chakan, Pune - 410501 | GSTIN: 27AABCP1234F1Z5', 14, 22);

  // Document Badge
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(pageWidth - 75, 7, 61, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COMMERCIAL QUOTE', pageWidth - 70, 15.5);

  // Metadata Grid
  let y = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);

  // Box Left: Customer Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 90, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('QUOTATION ISSUED TO:', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.companyName || quotation.customerName || 'Customer', 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Attn: ${quotation.customerName || 'Procurement Officer'}`, 18, y + 18);
  doc.text(`Phone: ${quotation.phone || '+91 - Registered Phone'}`, 18, y + 24);
  doc.text(`Address: ${quotation.address || 'Industrial Plant Facility'}`, 18, y + 30);

  // Box Right: Quotation Details
  doc.roundedRect(108, y, 88, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('QUOTATION REFERENCE:', 112, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Quote Number:', 112, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(quotation.fullNumber || quotation.quotationNumber || quotation.id || 'QTN-2026-0001', 142, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Quote Date:', 112, y + 19);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(quotation.quotationDate || quotation.createdAt), 142, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text('Revision:', 112, y + 25);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rev ${quotation.revisionNumber ?? 0}`, 142, y + 25);

  doc.setTextColor(100, 116, 139);
  doc.text('Validity:', 112, y + 31);
  doc.setTextColor(15, 23, 42);
  doc.text('30 Days from date', 142, y + 31);

  // Items Table
  y = 78;
  const items = quotation.items || [];
  const tableRows = items.map((item: any, idx: number) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const amount = Number(item.amount) || qty * rate;
    return [
      idx + 1,
      item.description || 'Custom Fabricated Industrial Component',
      qty,
      `INR ${formatCurrency(rate)}`,
      `INR ${formatCurrency(amount)}`,
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push([
      1,
      quotation.specificationNotes || 'Industrial Job Work as per Drawing',
      1,
      `INR ${formatCurrency(quotation.subtotal || quotation.totalAmount)}`,
      `INR ${formatCurrency(quotation.subtotal || quotation.totalAmount)}`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Sr', 'Scope of Supply / Specification', 'Qty', 'Unit Rate', 'Total Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 33, halign: 'right' },
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Financial Summary Box (Right Aligned)
  const subtotal = Number(quotation.subtotal || quotation.totalAmount || 0);
  const discount = Number(quotation.discountAmount || 0);
  const tax = Number(quotation.taxAmount || Math.round(subtotal * 0.18));
  const grandTotal = Number(quotation.totalAmount || subtotal - discount + tax);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 85, finalY, 71, 32, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', pageWidth - 80, finalY + 7);
  doc.text(`INR ${formatCurrency(subtotal)}`, pageWidth - 18, finalY + 7, { align: 'right' });

  if (discount > 0) {
    doc.text('Discount:', pageWidth - 80, finalY + 13);
    doc.text(`(-) INR ${formatCurrency(discount)}`, pageWidth - 18, finalY + 13, { align: 'right' });
  }

  doc.text(`GST (${quotation.taxPercent || 18}%):`, pageWidth - 80, finalY + 19);
  doc.text(`(+) INR ${formatCurrency(tax)}`, pageWidth - 18, finalY + 19, { align: 'right' });

  doc.setFillColor(37, 99, 235);
  doc.rect(pageWidth - 85, finalY + 23, 71, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Grand Total:', pageWidth - 80, finalY + 29);
  doc.text(`INR ${formatCurrency(grandTotal)}`, pageWidth - 18, finalY + 29, { align: 'right' });

  // Standard Commercial Terms & Conditions (Left Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('COMMERCIAL TERMS & CONDITIONS:', 14, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const terms = [
    '1. Price Basis: Ex-works Pune plant, freight and transit insurance at actuals.',
    '2. Taxes: GST charged extra as statutory prevailing rates.',
    '3. Payment Terms: 50% advance with formal purchase order, balance against dispatch.',
    '4. Delivery: 10-14 working days from date of drawing approval and advance receipt.',
  ];
  terms.forEach((t, i) => {
    doc.text(t, 14, finalY + 12 + i * 5);
  });

  // Authorized Signatory
  const signY = finalY + 45;
  if (signY < 270) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('For POWERTECH SOLUTIONS', pageWidth - 65, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signatory', pageWidth - 65, signY + 12);
  }

  return doc.output('blob');
}

export function generateInvoicePdf(invoice: any): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Dark Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('POWERTECH SOLUTIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Tax Invoice under Rule 46 of CGST Rules, 2017', 14, 17);
  doc.text('Plot 45, MIDC Industrial Area, Chakan, Pune - 410501 | GSTIN: 27AABCP1234F1Z5', 14, 22);

  // Invoice Title Badge
  doc.setFillColor(22, 163, 74); // green-600
  doc.roundedRect(pageWidth - 65, 7, 51, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TAX INVOICE', pageWidth - 57, 15.5);

  let y = 36;
  // Box Left: Billed To Customer
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 90, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('BILLED TO (BUYER):', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.companyName || invoice.customerName || 'Client Entity', 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`GSTIN: ${invoice.customerGstin || '27AABCT3518Q1Z8'}`, 18, y + 18);
  doc.text(`Contact: ${invoice.customerName || 'Accounts Department'}`, 18, y + 24);
  doc.text(`State / Code: Maharashtra (27)`, 18, y + 30);

  // Box Right: Invoice Meta
  doc.roundedRect(108, y, 88, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('INVOICE CREDENTIALS:', 112, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice Number:', 112, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(invoice.invoiceNumber || invoice.id || 'INV-2026-0001', 145, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice Date:', 112, y + 19);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(invoice.billingDate || invoice.createdAt), 145, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text('Due Date:', 112, y + 25);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(invoice.dueDate), 145, y + 25);

  doc.setTextColor(100, 116, 139);
  doc.text('Order Ref:', 112, y + 31);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.order?.orderNumber || 'ORD-2026-DIRECT', 145, y + 31);

  // Items Table
  y = 78;
  const items = invoice.items || [];
  const tableRows = items.map((item: any, idx: number) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const amount = Number(item.amount) || qty * rate;
    return [
      idx + 1,
      item.description || 'Industrial Fabrication & Laser Job Work',
      item.hsnCode || '8504',
      qty,
      `INR ${formatCurrency(rate)}`,
      `INR ${formatCurrency(amount)}`,
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push([
      1,
      'Industrial Laser Cutting & Fabrication Services',
      '8504',
      1,
      `INR ${formatCurrency(invoice.subtotal || invoice.totalAmount)}`,
      `INR ${formatCurrency(invoice.subtotal || invoice.totalAmount)}`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Sr', 'Item Description', 'HSN/SAC', 'Qty', 'Unit Rate', 'Taxable Value']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 85 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Financial Breakdown Box
  const subtotal = Number(invoice.subtotal || invoice.totalAmount || 0);
  const cgst = Number(invoice.cgstAmount || Math.round(subtotal * 0.09));
  const sgst = Number(invoice.sgstAmount || Math.round(subtotal * 0.09));
  const igst = Number(invoice.igstAmount || 0);
  const totalTax = cgst + sgst + igst;
  const grandTotal = Number(invoice.totalAmount || subtotal + totalTax);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 85, finalY, 71, 38, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Taxable Amount:', pageWidth - 80, finalY + 6);
  doc.text(`INR ${formatCurrency(subtotal)}`, pageWidth - 18, finalY + 6, { align: 'right' });

  doc.text('CGST (9%):', pageWidth - 80, finalY + 12);
  doc.text(`INR ${formatCurrency(cgst)}`, pageWidth - 18, finalY + 12, { align: 'right' });

  doc.text('SGST (9%):', pageWidth - 80, finalY + 18);
  doc.text(`INR ${formatCurrency(sgst)}`, pageWidth - 18, finalY + 18, { align: 'right' });

  if (igst > 0) {
    doc.text('IGST (18%):', pageWidth - 80, finalY + 24);
    doc.text(`INR ${formatCurrency(igst)}`, pageWidth - 18, finalY + 24, { align: 'right' });
  }

  doc.setFillColor(22, 163, 74);
  doc.rect(pageWidth - 85, finalY + 29, 71, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Total Invoice Amount:', pageWidth - 80, finalY + 35);
  doc.text(`INR ${formatCurrency(grandTotal)}`, pageWidth - 18, finalY + 35, { align: 'right' });

  // Bank Account & NEFT Settlement Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SETTLEMENT BANK DETAILS (NEFT / RTGS):', 14, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const bankLines = [
    'Beneficiary Name: POWERTECH SOLUTIONS PVT LTD',
    'Bank Name: HDFC Bank Ltd | Branch: Chakan Industrial Area',
    'Current Account No: 50200088991122',
    'IFSC Code: HDFC0001234 | MICR: 411240055',
  ];
  bankLines.forEach((b, i) => {
    doc.text(b, 14, finalY + 12 + i * 5);
  });

  // Signatory Box
  const signY = finalY + 45;
  if (signY < 270) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('For POWERTECH SOLUTIONS', pageWidth - 65, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Finance Signatory', pageWidth - 65, signY + 12);
  }

  return doc.output('blob');
}
