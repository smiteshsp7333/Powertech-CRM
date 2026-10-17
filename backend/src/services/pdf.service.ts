import PDFDocument from 'pdfkit';

interface QuotationPdfData {
  fullNumber: string;
  quotationDate: Date;
  validUntil?: Date | null;
  customerName: string;
  companyName?: string | null;
  phone: string;
  address?: string | null;
  gstin?: string | null;
  items: {
    itemDescription: string;
    specification?: string | null;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  specificationNotes?: string | null;
  termsAndConditions?: string | null;
  companySettings?: Record<string, string>;
}

interface InvoicePdfData {
  invoiceNumber: string;
  invoiceType: string;
  billingDate: Date;
  dueDate: Date;
  orderNumber?: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  address?: string | null;
  customerGstin?: string | null;
  placeOfSupply?: string | null;
  items: {
    itemDescription: string;
    hsnSacCode?: string | null;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountReceived: number;
  balanceAmount: number;
  paymentStatus: string;
  companySettings?: Record<string, string>;
}

export function generateQuotationPDF(data: QuotationPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const companyName = data.companySettings?.COMPANY_NAME || 'Powertech Industrial Solutions Pvt. Ltd.';
      const companyAddress = data.companySettings?.COMPANY_ADDRESS || 'Plot 18, Bhosari MIDC, Pune, Maharashtra 411026';
      const companyPhone = data.companySettings?.COMPANY_PHONE || '+91 20 2740 5500';
      const companyEmail = data.companySettings?.COMPANY_EMAIL || 'contact@powertech.com';
      const companyGstin = data.companySettings?.COMPANY_GSTIN || '27AABCP9999K1Z5';

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(companyName.toUpperCase(), 55, 52);
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(companyAddress, 55, 72);
      doc.text(`Phone: ${companyPhone} | Email: ${companyEmail} | GSTIN: ${companyGstin}`, 55, 84);

      // Title
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('COMMERCIAL QUOTATION', 40, 120, { align: 'center', underline: true });

      // Info Grid
      const infoTop = 145;
      doc.fontSize(9).fillColor('#0f172a');

      // Left Column - Client
      doc.font('Helvetica-Bold').text('CLIENT DETAILS:', 40, infoTop);
      doc.font('Helvetica').text(`Name: ${data.customerName}`, 40, infoTop + 14);
      if (data.companyName) doc.text(`Company: ${data.companyName}`, 40, infoTop + 26);
      doc.text(`Phone: ${data.phone}`, 40, infoTop + 38);
      if (data.address) doc.text(`Address: ${data.address}`, 40, infoTop + 50);

      // Right Column - Quotation Info
      const rightCol = 360;
      doc.font('Helvetica-Bold').text('QUOTATION DETAILS:', rightCol, infoTop);
      doc.font('Helvetica').text(`Quotation No: ${data.fullNumber}`, rightCol, infoTop + 14);
      doc.text(`Date: ${new Date(data.quotationDate).toLocaleDateString()}`, rightCol, infoTop + 26);
      if (data.validUntil) {
        doc.text(`Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`, rightCol, infoTop + 38);
      }

      // Line Items Table Header
      const tableTop = 220;
      doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 45, tableTop + 6, { width: 25 });
      doc.text('ITEM DESCRIPTION', 75, tableTop + 6, { width: 260 });
      doc.text('QTY', 340, tableTop + 6, { width: 40, align: 'right' });
      doc.text('RATE (INR)', 390, tableTop + 6, { width: 75, align: 'right' });
      doc.text('AMOUNT (INR)', 475, tableTop + 6, { width: 75, align: 'right' });

      // Table Rows
      let currentY = tableTop + 24;
      data.items.forEach((item, index) => {
        doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
        doc.text(String(index + 1), 45, currentY, { width: 25 });
        doc.text(item.itemDescription, 75, currentY, { width: 260 });
        if (item.specification) {
          doc.fillColor('#64748b').fontSize(7).text(item.specification, 75, currentY + 11, { width: 260 });
        }
        doc.fillColor('#1e293b').fontSize(8);
        doc.text(`${item.quantity} ${item.unit}`, 340, currentY, { width: 40, align: 'right' });
        doc.text(item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 390, currentY, { width: 75, align: 'right' });
        doc.text(item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 475, currentY, { width: 75, align: 'right' });

        currentY += item.specification ? 26 : 18;
      });

      // Totals
      currentY += 10;
      doc.rect(340, currentY, 215, 75).stroke('#e2e8f0');
      doc.fontSize(8).fillColor('#334155').font('Helvetica');
      doc.text('Subtotal:', 350, currentY + 8);
      doc.text(`INR ${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 8, { align: 'right', width: 105 });

      doc.text('Discount:', 350, currentY + 22);
      doc.text(`INR ${data.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 22, { align: 'right', width: 105 });

      doc.text('Tax (GST):', 350, currentY + 36);
      doc.text(`INR ${data.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 36, { align: 'right', width: 105 });

      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT:', 350, currentY + 54);
      doc.text(`INR ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 54, { align: 'right', width: 105 });

      // Notes and Terms
      currentY += 95;
      if (data.specificationNotes) {
        doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text('SPECIFICATION NOTES:', 40, currentY);
        doc.font('Helvetica').fillColor('#475569').text(data.specificationNotes, 40, currentY + 12, { width: 515 });
        currentY += 35;
      }

      if (data.termsAndConditions) {
        doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text('TERMS AND CONDITIONS:', 40, currentY);
        doc.font('Helvetica').fillColor('#475569').text(data.termsAndConditions, 40, currentY + 12, { width: 515 });
      }

      // Footer
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica').text('This is a computer generated quotation by Powertech CRM.', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateInvoicePDF(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const companyName = data.companySettings?.COMPANY_NAME || 'Powertech Industrial Solutions Pvt. Ltd.';
      const companyAddress = data.companySettings?.COMPANY_ADDRESS || 'Plot 18, Bhosari MIDC, Pune, Maharashtra 411026';
      const companyGstin = data.companySettings?.COMPANY_GSTIN || '27AABCP9999K1Z5';
      const bankName = data.companySettings?.BANK_NAME || 'HDFC Bank Ltd.';
      const bankAcc = data.companySettings?.BANK_ACCOUNT_NO || '50200012345678';
      const bankIfsc = data.companySettings?.BANK_IFSC || 'HDFC0001234';

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#0f766e');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(companyName.toUpperCase(), 55, 52);
      doc.fontSize(8).font('Helvetica').fillColor('#ccfbf1').text(companyAddress, 55, 72);
      doc.text(`GSTIN: ${companyGstin}`, 55, 84);

      // Title
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 40, 120, { align: 'center', underline: true });

      // Invoice Details Left/Right
      const infoTop = 145;
      doc.fontSize(9).fillColor('#0f172a');
      doc.font('Helvetica-Bold').text('BILLED TO:', 40, infoTop);
      doc.font('Helvetica').text(`Customer: ${data.customerName}`, 40, infoTop + 14);
      if (data.companyName) doc.text(`Company: ${data.companyName}`, 40, infoTop + 26);
      doc.text(`Phone: ${data.phone}`, 40, infoTop + 38);
      if (data.customerGstin) doc.text(`GSTIN: ${data.customerGstin}`, 40, infoTop + 50);

      const rightCol = 360;
      doc.font('Helvetica-Bold').text('INVOICE METADATA:', rightCol, infoTop);
      doc.font('Helvetica').text(`Invoice No: ${data.invoiceNumber}`, rightCol, infoTop + 14);
      doc.text(`Billing Date: ${new Date(data.billingDate).toLocaleDateString()}`, rightCol, infoTop + 26);
      doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, rightCol, infoTop + 38);
      if (data.orderNumber) doc.text(`Order Ref: ${data.orderNumber}`, rightCol, infoTop + 50);

      // Line items table
      const tableTop = 225;
      doc.rect(40, tableTop, 515, 20).fill('#f8fafc');
      doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 45, tableTop + 6, { width: 25 });
      doc.text('ITEM DESCRIPTION', 75, tableTop + 6, { width: 230 });
      doc.text('HSN/SAC', 310, tableTop + 6, { width: 55 });
      doc.text('QTY', 370, tableTop + 6, { width: 35, align: 'right' });
      doc.text('RATE', 410, tableTop + 6, { width: 65, align: 'right' });
      doc.text('AMOUNT', 480, tableTop + 6, { width: 70, align: 'right' });

      let currentY = tableTop + 24;
      data.items.forEach((item, index) => {
        doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
        doc.text(String(index + 1), 45, currentY, { width: 25 });
        doc.text(item.itemDescription, 75, currentY, { width: 230 });
        doc.text(item.hsnSacCode || '-', 310, currentY, { width: 55 });
        doc.text(`${item.quantity} ${item.unit}`, 370, currentY, { width: 35, align: 'right' });
        doc.text(item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 410, currentY, { width: 65, align: 'right' });
        doc.text(item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 480, currentY, { width: 70, align: 'right' });
        currentY += 18;
      });

      // Tax breakdown & totals
      currentY += 10;
      doc.rect(340, currentY, 215, 110).stroke('#cbd5e1');
      doc.fontSize(8).fillColor('#334155').font('Helvetica');

      doc.text('Taxable Subtotal:', 350, currentY + 8);
      doc.text(`INR ${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 8, { align: 'right', width: 105 });

      if (data.cgstAmount > 0) {
        doc.text('CGST:', 350, currentY + 22);
        doc.text(`INR ${data.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 22, { align: 'right', width: 105 });

        doc.text('SGST:', 350, currentY + 36);
        doc.text(`INR ${data.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 36, { align: 'right', width: 105 });
      } else if (data.igstAmount > 0) {
        doc.text('IGST:', 350, currentY + 22);
        doc.text(`INR ${data.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 22, { align: 'right', width: 105 });
      }

      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold');
      doc.text('INVOICE TOTAL:', 350, currentY + 54);
      doc.text(`INR ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 54, { align: 'right', width: 105 });

      doc.fontSize(8).fillColor('#166534').font('Helvetica');
      doc.text('Amount Received:', 350, currentY + 74);
      doc.text(`INR ${data.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 74, { align: 'right', width: 105 });

      doc.fontSize(9).fillColor(data.balanceAmount > 0 ? '#b91c1c' : '#15803d').font('Helvetica-Bold');
      doc.text('BALANCE DUE:', 350, currentY + 90);
      doc.text(`INR ${data.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, currentY + 90, { align: 'right', width: 105 });

      // Bank Details
      const bankTop = currentY + 125;
      doc.rect(40, bankTop, 270, 65).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
      doc.text('BANK REMITTANCE DETAILS:', 50, bankTop + 8);
      doc.fillColor('#334155').font('Helvetica');
      doc.text(`Bank: ${bankName}`, 50, bankTop + 22);
      doc.text(`A/C No: ${bankAcc}`, 50, bankTop + 34);
      doc.text(`IFSC: ${bankIfsc}`, 50, bankTop + 46);

      // Footer
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica').text('Subject to Pune Jurisdiction. This is a computer generated tax invoice.', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
