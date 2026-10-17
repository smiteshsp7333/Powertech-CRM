// Powertech ERP - Pure Business Logic & Financial Calculations

export interface LineItemInput {
  quantity: number;
  rate: number;
}

export interface QuotationCalculationInput {
  items: LineItemInput[];
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  taxRate: number;
}

export interface QuotationCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceTaxInput {
  subtotal: number;
  discountAmount?: number;
  isInterState?: boolean;
  gstRate?: number; // Total GST rate, e.g. 18%
}

export interface InvoiceTaxResult {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceBalanceResult {
  amountReceived: number;
  creditNoteAmount: number;
  balanceAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
}

export type AgeingBucket = '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';

/**
 * Rounds a number to exactly two decimal places
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates item subtotal and totals for quotations
 */
export function calculateQuotationTotals(input: QuotationCalculationInput): QuotationCalculationResult {
  const subtotal = round2(
    input.items.reduce((sum, item) => sum + round2(Math.max(0, item.quantity) * Math.max(0, item.rate)), 0)
  );

  let discountAmount = 0;
  if (input.discountType === 'PERCENT') {
    const percent = Math.min(100, Math.max(0, input.discountValue));
    discountAmount = round2((subtotal * percent) / 100);
  } else {
    discountAmount = round2(Math.min(subtotal, Math.max(0, input.discountValue)));
  }

  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));
  const taxRate = Math.max(0, input.taxRate);
  const taxAmount = round2((taxableAmount * taxRate) / 100);
  const totalAmount = round2(taxableAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
  };
}

/**
 * Calculates GST components (CGST+SGST vs IGST) for invoices
 */
export function calculateInvoiceTaxes(input: InvoiceTaxInput): InvoiceTaxResult {
  const subtotal = round2(Math.max(0, input.subtotal));
  const discount = round2(Math.min(subtotal, Math.max(0, input.discountAmount || 0)));
  const taxableAmount = round2(subtotal - discount);
  const gstRate = Math.max(0, input.gstRate ?? 18);

  if (input.isInterState) {
    const igstRate = gstRate;
    const igstAmount = round2((taxableAmount * igstRate) / 100);
    return {
      taxableAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate,
      igstAmount,
      taxAmount: igstAmount,
      totalAmount: round2(taxableAmount + igstAmount),
    };
  } else {
    const halfRate = round2(gstRate / 2);
    const cgstAmount = round2((taxableAmount * halfRate) / 100);
    const sgstAmount = round2((taxableAmount * halfRate) / 100);
    const taxAmount = round2(cgstAmount + sgstAmount);
    return {
      taxableAmount,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      taxAmount,
      totalAmount: round2(taxableAmount + taxAmount),
    };
  }
}

/**
 * Calculates invoice balance outstanding and payment status
 */
export function calculateInvoiceBalance(
  totalAmount: number,
  received: number,
  creditNote: number = 0,
  dueDate: Date = new Date(),
  currentDate: Date = new Date()
): InvoiceBalanceResult {
  const total = round2(Math.max(0, totalAmount));
  const receivedAmount = round2(Math.max(0, received));
  const creditAmount = round2(Math.max(0, creditNote));
  const totalSettled = round2(receivedAmount + creditAmount);

  const balanceAmount = round2(Math.max(0, total - totalSettled));

  let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' = 'UNPAID';

  if (totalSettled >= total && total > 0) {
    paymentStatus = 'PAID';
  } else if (totalSettled > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  } else {
    if (new Date(dueDate).getTime() < new Date(currentDate).getTime()) {
      paymentStatus = 'OVERDUE';
    } else {
      paymentStatus = 'UNPAID';
    }
  }

  return {
    amountReceived: receivedAmount,
    creditNoteAmount: creditAmount,
    balanceAmount,
    paymentStatus,
  };
}

/**
 * Calculates ageing category based on invoice date or due date
 */
export function calculateAgeingBucket(targetDate: Date, referenceDate: Date = new Date()): AgeingBucket {
  const diffTime = referenceDate.getTime() - new Date(targetDate).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return '0-30 days';
  if (diffDays <= 60) return '31-60 days';
  if (diffDays <= 90) return '61-90 days';
  return '90+ days';
}
