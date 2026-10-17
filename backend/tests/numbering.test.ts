import prisma from '../src/config/prisma';
import {
  getNextSequenceNumber,
  getFinancialYearString,
  getCalendarYearString,
} from '../src/utils/sequence';

describe('Number Sequencing & Duplicate Prevention', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('generates correct calendar year and financial year formats', () => {
    const calendarYear = getCalendarYearString(new Date('2026-05-15'));
    expect(calendarYear).toBe('2026');

    // May 2026 is FY 2026-27
    const fyMay = getFinancialYearString(new Date('2026-05-15'));
    expect(fyMay).toBe('2026-27');

    // February 2026 is FY 2025-26
    const fyFeb = getFinancialYearString(new Date('2026-02-10'));
    expect(fyFeb).toBe('2025-26');
  });

  test('generates sequence numbers in strictly increasing atomic order without duplicates', async () => {
    const seq1 = await getNextSequenceNumber({
      module: 'ENQUIRY',
      prefix: 'ENQ',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
    });

    const seq2 = await getNextSequenceNumber({
      module: 'ENQUIRY',
      prefix: 'ENQ',
      yearFormat: 'CALENDAR_YEAR',
      padding: 5,
    });

    expect(seq1).toMatch(/^ENQ-\d{4}-\d{5}$/);
    expect(seq2).toMatch(/^ENQ-\d{4}-\d{5}$/);

    const num1 = parseInt(seq1.split('-')[2], 10);
    const num2 = parseInt(seq2.split('-')[2], 10);
    expect(num2).toBe(num1 + 1);
  });

  test('generates invoice sequence with financial year format', async () => {
    const invSeq = await getNextSequenceNumber({
      module: 'INVOICE',
      prefix: 'INV',
      yearFormat: 'FINANCIAL_YEAR',
      padding: 5,
    });

    expect(invSeq).toMatch(/^INV-\d{4}-\d{2}-\d{5}$/);
  });
});
