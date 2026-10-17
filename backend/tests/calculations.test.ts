import {
  calculateQuotationTotals,
  calculateInvoiceTaxes,
  calculateInvoiceBalance,
  calculateAgeingBucket,
  round2,
} from '../src/utils/calculations';

describe('Financial & Tax Calculations', () => {
  describe('calculateQuotationTotals', () => {
    test('calculates correct subtotal, percentage discount, and tax', () => {
      const result = calculateQuotationTotals({
        items: [
          { quantity: 2, rate: 50000 }, // 100,000
          { quantity: 1, rate: 20000 }, // 20,000
        ],
        discountType: 'PERCENT',
        discountValue: 10, // 10% of 120,000 = 12,000
        taxRate: 18, // 18% of 108,000 = 19,440
      });

      expect(result.subtotal).toBe(120000);
      expect(result.discountAmount).toBe(12000);
      expect(result.taxableAmount).toBe(108000);
      expect(result.taxAmount).toBe(19440);
      expect(result.totalAmount).toBe(127440);
    });

    test('calculates fixed discount correctly', () => {
      const result = calculateQuotationTotals({
        items: [{ quantity: 1, rate: 10000 }],
        discountType: 'FIXED',
        discountValue: 1500,
        taxRate: 18,
      });

      expect(result.subtotal).toBe(10000);
      expect(result.discountAmount).toBe(1500);
      expect(result.taxableAmount).toBe(8500);
      expect(result.taxAmount).toBe(1530);
      expect(result.totalAmount).toBe(10030);
    });
  });

  describe('calculateInvoiceTaxes', () => {
    test('splits intra-state GST into equal CGST and SGST', () => {
      const result = calculateInvoiceTaxes({
        subtotal: 100000,
        discountAmount: 10000,
        isInterState: false,
        gstRate: 18,
      });

      expect(result.taxableAmount).toBe(90000);
      expect(result.cgstRate).toBe(9);
      expect(result.cgstAmount).toBe(8100);
      expect(result.sgstRate).toBe(9);
      expect(result.sgstAmount).toBe(8100);
      expect(result.igstAmount).toBe(0);
      expect(result.taxAmount).toBe(16200);
      expect(result.totalAmount).toBe(106200);
    });

    test('allocates 100% to IGST for inter-state supply', () => {
      const result = calculateInvoiceTaxes({
        subtotal: 100000,
        discountAmount: 0,
        isInterState: true,
        gstRate: 18,
      });

      expect(result.taxableAmount).toBe(100000);
      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstRate).toBe(18);
      expect(result.igstAmount).toBe(18000);
      expect(result.taxAmount).toBe(18000);
      expect(result.totalAmount).toBe(118000);
    });
  });

  describe('calculateInvoiceBalance', () => {
    test('marks as PAID when total settled equals total amount', () => {
      const result = calculateInvoiceBalance(100000, 100000, 0);
      expect(result.balanceAmount).toBe(0);
      expect(result.paymentStatus).toBe('PAID');
    });

    test('marks as PARTIALLY_PAID when partial amount received', () => {
      const result = calculateInvoiceBalance(100000, 40000, 10000);
      expect(result.balanceAmount).toBe(50000);
      expect(result.paymentStatus).toBe('PARTIALLY_PAID');
    });

    test('marks as OVERDUE when zero payment and due date has passed', () => {
      const pastDueDate = new Date('2026-01-01');
      const today = new Date('2026-03-01');
      const result = calculateInvoiceBalance(50000, 0, 0, pastDueDate, today);
      expect(result.balanceAmount).toBe(50000);
      expect(result.paymentStatus).toBe('OVERDUE');
    });

    test('marks as UNPAID when zero payment and due date is in the future', () => {
      const futureDueDate = new Date('2026-12-31');
      const today = new Date('2026-03-01');
      const result = calculateInvoiceBalance(50000, 0, 0, futureDueDate, today);
      expect(result.balanceAmount).toBe(50000);
      expect(result.paymentStatus).toBe('UNPAID');
    });
  });

  describe('calculateAgeingBucket', () => {
    const baseDate = new Date('2026-05-01');

    test('classifies into 0-30 days', () => {
      const target = new Date('2026-04-15');
      expect(calculateAgeingBucket(target, baseDate)).toBe('0-30 days');
    });

    test('classifies into 31-60 days', () => {
      const target = new Date('2026-03-15');
      expect(calculateAgeingBucket(target, baseDate)).toBe('31-60 days');
    });

    test('classifies into 61-90 days', () => {
      const target = new Date('2026-02-15');
      expect(calculateAgeingBucket(target, baseDate)).toBe('61-90 days');
    });

    test('classifies into 90+ days', () => {
      const target = new Date('2025-12-01');
      expect(calculateAgeingBucket(target, baseDate)).toBe('90+ days');
    });
  });
});
