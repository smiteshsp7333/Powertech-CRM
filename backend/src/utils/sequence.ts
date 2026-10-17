import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';

export type SequenceModule =
  | 'ENQUIRY'
  | 'QUOTATION'
  | 'ORDER'
  | 'DISPATCH'
  | 'INVOICE'
  | 'PAYMENT'
  | 'PURCHASE';

interface SequenceOptions {
  module: SequenceModule;
  prefix: string;
  yearFormat?: 'CALENDAR_YEAR' | 'FINANCIAL_YEAR';
  padding?: number;
  tx?: PrismaClient | any;
}

/**
 * Returns current Indian Financial Year string (e.g. 2026-27 if in October 2026)
 */
export function getFinancialYearString(date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 3 = April
  const fullYear = date.getFullYear();
  let startYear = fullYear;
  if (month < 3) {
    startYear = fullYear - 1;
  }
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

/**
 * Returns Calendar Year string (e.g. 2026)
 */
export function getCalendarYearString(date = new Date()): string {
  return String(date.getFullYear());
}

/**
 * Generates the next sequential number atomically inside a transaction to prevent duplicates.
 */
export async function getNextSequenceNumber(options: SequenceOptions): Promise<string> {
  const {
    module,
    prefix,
    yearFormat = 'CALENDAR_YEAR',
    padding = 5,
    tx = prisma,
  } = options;

  const yearString =
    yearFormat === 'FINANCIAL_YEAR'
      ? getFinancialYearString()
      : getCalendarYearString();

  // Upsert inside transaction
  const sequenceRecord = await tx.numberSequence.upsert({
    where: {
      module_year: {
        module,
        year: yearString,
      },
    },
    update: {
      lastSequence: {
        increment: 1,
      },
    },
    create: {
      module,
      prefix,
      year: yearString,
      lastSequence: 1,
      formatPattern: `{PREFIX}-{YEAR}-{SEQ:${padding}}`,
    },
  });

  const paddedNumber = String(sequenceRecord.lastSequence).padStart(padding, '0');
  return `${prefix}-${yearString}-${paddedNumber}`;
}
