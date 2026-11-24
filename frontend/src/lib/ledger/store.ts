import { CompanyDailyEntry, CompanySummary, GroupGrandTotal } from '../../types/ledger';
import { GROUP_COMPANIES } from './companies';

export const STORAGE_KEY = 'group_billing_ledger_nov2026_v5';

// Audited November figures from client spreadsheet (Period: 01/11/2026 - 17/11/2026)
// Stored under date 2026-11-17 as historical audited baseline
export const SEED_ENTRIES: CompanyDailyEntry[] = [
  {
    id: 'pt-laser_2026-11-17',
    companyId: 'pt-laser',
    companyName: 'POWER TECH LASER',
    date: '2026-11-17',
    billing: 1351232,
    otherBilling: 58032,
    billingWithGst: 1594454,
    paymentCollection: 1408469,
    otherPayment: 24290,
    todayBilling: 1652486,
    todayPayment: 1432759,
    paymentReceivedAt: '17-11-2026, 04:30 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'PTL Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'pt-i-laser_2026-11-17',
    companyId: 'pt-i-laser',
    companyName: 'POWER TECH I LASER',
    date: '2026-11-17',
    billing: 1135363,
    otherBilling: 350,
    billingWithGst: 1339728,
    paymentCollection: 506609,
    otherPayment: 350,
    todayBilling: 1340078,
    todayPayment: 506959,
    paymentReceivedAt: '17-11-2026, 03:45 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'PTIL Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'pt-laser-works_2026-11-17',
    companyId: 'pt-laser-works',
    companyName: 'POWER TECH LASER WORKS',
    date: '2026-11-17',
    billing: 771859,
    otherBilling: 8400,
    billingWithGst: 910794,
    paymentCollection: 564779,
    otherPayment: 25515,
    todayBilling: 919194,
    todayPayment: 590294,
    paymentReceivedAt: '17-11-2026, 05:15 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'PTLW Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'merit-i-laser_2026-11-17',
    companyId: 'merit-i-laser',
    companyName: 'MERIT I LASER',
    date: '2026-11-17',
    billing: 560080,
    otherBilling: 0,
    billingWithGst: 660894,
    paymentCollection: 104332,
    otherPayment: 0,
    todayBilling: 660894,
    todayPayment: 104332,
    paymentReceivedAt: '17-11-2026, 02:20 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'MIL Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'pt-laser-cutting_2026-11-17',
    companyId: 'pt-laser-cutting',
    companyName: 'POWER TECH LASER CUTTING',
    date: '2026-11-17',
    billing: 2727678,
    otherBilling: 5500,
    billingWithGst: 3218660,
    paymentCollection: 2453772,
    otherPayment: 6362,
    todayBilling: 3224160,
    todayPayment: 2460134,
    paymentReceivedAt: '17-11-2026, 04:00 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'PTLC Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'galaxy-laser-cutting_2026-11-17',
    companyId: 'galaxy-laser-cutting',
    companyName: 'GALAXY LASER CUTTING',
    date: '2026-11-17',
    billing: 640223,
    otherBilling: 7000,
    billingWithGst: 755463,
    paymentCollection: 1863930,
    otherPayment: 7000,
    todayBilling: 762463,
    todayPayment: 1870930,
    paymentReceivedAt: '17-11-2026, 04:45 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'GLC Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'galaxy-pvd_2026-11-17',
    companyId: 'galaxy-pvd',
    companyName: 'GALAXY PVD COATING',
    date: '2026-11-17',
    billing: 1004675,
    otherBilling: 356885,
    billingWithGst: 1185517,
    paymentCollection: 2158772,
    otherPayment: 356885,
    todayBilling: 1542402,
    todayPayment: 2515657,
    paymentReceivedAt: '17-11-2026, 06:10 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'GPVD Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'rainbow-pvd_2026-11-17',
    companyId: 'rainbow-pvd',
    companyName: 'RAINBOW PVD COATING',
    date: '2026-11-17',
    billing: 443746,
    otherBilling: 490465,
    billingWithGst: 523620,
    paymentCollection: 422114,
    otherPayment: 480080,
    todayBilling: 1014085,
    todayPayment: 902194,
    paymentReceivedAt: '17-11-2026, 03:30 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'RPVD Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
  {
    id: 'diamond-pvd_2026-11-17',
    companyId: 'diamond-pvd',
    companyName: 'DIAMOND PVD COATING',
    date: '2026-11-17',
    billing: 630223,
    otherBilling: 719574,
    billingWithGst: 743663,
    paymentCollection: 1052839,
    otherPayment: 665350,
    todayBilling: 1463237,
    todayPayment: 1718189,
    paymentReceivedAt: '17-11-2026, 05:40 PM',
    paymentMode: 'BANK_TRANSFER',
    submittedBy: 'DPVD Operator',
    submittedAt: '2026-11-17T17:00:00.000Z',
  },
];

export function sanitizeEntry(raw: CompanyDailyEntry): CompanyDailyEntry {
  const entry = { ...raw };

  const bWithGst =
    typeof entry.billingWithGst === 'number'
      ? entry.billingWithGst
      : typeof entry.billing === 'number'
      ? Math.round(entry.billing * 1.18)
      : typeof entry.todayBilling === 'number'
      ? entry.todayBilling
      : 0;

  const oBill = typeof entry.otherBilling === 'number' ? entry.otherBilling : 0;

  let pCol =
    typeof entry.paymentCollection === 'number'
      ? entry.paymentCollection
      : typeof entry.todayPayment === 'number'
      ? entry.todayPayment
      : 0;

  let oPay = typeof entry.otherPayment === 'number' ? entry.otherPayment : 0;

  // Purge any legacy auto-calculated dummy figures (e.g. 5% / 95% ratio artifacts)
  // 1. If otherPayment equals exactly 5% of paymentCollection or todayPayment while the total collection equaled paymentCollection:
  if (
    oPay > 0 &&
    pCol > 0 &&
    (oPay === Math.round(pCol * 0.05) || oPay === Math.round((entry.todayPayment ?? pCol) * 0.05))
  ) {
    if (entry.todayPayment === pCol || entry.todayPayment === undefined) {
      oPay = 0;
    }
  }

  // 2. If paymentCollection equals exactly 95% of todayPayment while otherPayment was the only receipt:
  if (
    pCol > 0 &&
    oPay > 0 &&
    (pCol === Math.round((entry.todayPayment ?? oPay) * 0.95) || pCol === Math.round(oPay * 0.95))
  ) {
    if (entry.todayPayment === oPay) {
      pCol = 0;
    }
  }

  const calculatedBase = bWithGst > 0 ? Math.round(bWithGst / 1.18) : typeof entry.billing === 'number' ? entry.billing : 0;
  // Bill = Base bill + other bill (NO GST to be added)
  const calculatedTotalBilling = calculatedBase + oBill;
  const calculatedTotalPayment = pCol + oPay;

  return {
    ...entry,
    billing: calculatedBase,
    otherBilling: oBill,
    billingWithGst: bWithGst,
    paymentCollection: pCol,
    otherPayment: oPay,
    todayBilling: calculatedTotalBilling,
    todayPayment: calculatedTotalPayment,
  };
}

export function loadAllEntries(): Record<string, CompanyDailyEntry> {
  if (typeof window === 'undefined') {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((e) => {
      map[e.id] = sanitizeEntry(e);
    });
    return map;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((e) => {
      map[e.id] = sanitizeEntry(e);
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return map;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitizedMap: Record<string, CompanyDailyEntry> = {};
    Object.keys(parsed).forEach((k) => {
      sanitizedMap[k] = sanitizeEntry(parsed[k]);
    });
    return sanitizedMap;
  } catch (e) {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((entry) => {
      map[entry.id] = sanitizeEntry(entry);
    });
    return map;
  }
}

export async function syncEntryToCloud(entry: CompanyDailyEntry): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.entries));
      }
    }
  } catch (err) {
    console.error('Failed to publish entry to cloud API:', err);
  }
}

export function saveCompanyDailyEntry(entry: CompanyDailyEntry): void {
  if (typeof window === 'undefined') return;

  const sanitized = sanitizeEntry(entry);
  const all = loadAllEntries();
  const key = `${sanitized.companyId}_${sanitized.date}`;
  all[key] = {
    ...sanitized,
    id: key,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  syncEntryToCloud(sanitized);
}

export function deleteCompanyDailyEntry(companyId: string, date: string): void {
  if (typeof window === 'undefined') return;

  const all = loadAllEntries();
  const key = `${companyId}_${date}`;
  delete all[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  // Sync delete to cloud backend
  fetch(`/api/ledger?companyId=${encodeURIComponent(companyId)}&date=${encodeURIComponent(date)}`, {
    method: 'DELETE',
  }).catch((err) => console.error('Failed to delete cloud entry:', err));
}

export function getCompanyEntries(companyId: string): CompanyDailyEntry[] {
  const all = loadAllEntries();
  return Object.values(all)
    .filter((e) => e.companyId === companyId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function computeConsolidatedSummary(
  targetDate: string,
  entriesMap: Record<string, CompanyDailyEntry>
): {
  summaries: CompanySummary[];
  grandTotal: GroupGrandTotal;
} {
  const targetMonthPrefix = targetDate.slice(0, 7); // e.g. "2026-11"

  const allEntriesList = Object.values(entriesMap);

  const summaries: CompanySummary[] = GROUP_COMPANIES.map((company) => {
    const todayKey = `${company.id}_${targetDate}`;

    const companyMonthEntries = allEntriesList
      .filter((e) => e.companyId === company.id && e.date.startsWith(targetMonthPrefix))
      .map((e) => sanitizeEntry(e));

    // Strict date lookup: today shows only what was entered for this specific date
    const rawTodayEntry = entriesMap[todayKey];
    const todayEntry = rawTodayEntry ? sanitizeEntry(rawTodayEntry) : undefined;

    const billing =
      typeof todayEntry?.billing === 'number'
        ? todayEntry.billing
        : todayEntry?.billingWithGst
        ? Math.round(todayEntry.billingWithGst / 1.18)
        : 0;
    const otherBilling = typeof todayEntry?.otherBilling === 'number' ? todayEntry.otherBilling : 0;
    const billingWithGst =
      typeof todayEntry?.billingWithGst === 'number'
        ? todayEntry.billingWithGst
        : billing > 0
        ? Math.round(billing * 1.18)
        : todayEntry?.todayBilling ?? 0;
    const paymentCollection =
      typeof todayEntry?.paymentCollection === 'number' ? todayEntry.paymentCollection : 0;
    const otherPayment = typeof todayEntry?.otherPayment === 'number' ? todayEntry.otherPayment : 0;

    // Bill = Base bill + other bill (NO GST to be added)
    const todayBilling = billing + otherBilling;
    const todayPayment = paymentCollection + otherPayment;

    const monthBilling = companyMonthEntries.reduce(
      (acc, e) =>
        acc + (typeof e.billing === 'number' ? e.billing : e.billingWithGst ? Math.round(e.billingWithGst / 1.18) : 0),
      0
    );
    const monthOtherBilling = companyMonthEntries.reduce(
      (acc, e) => acc + (typeof e.otherBilling === 'number' ? e.otherBilling : 0),
      0
    );
    const monthBillingWithGst = companyMonthEntries.reduce(
      (acc, e) =>
        acc +
        (typeof e.billingWithGst === 'number'
          ? e.billingWithGst
          : e.billing
          ? Math.round(e.billing * 1.18)
          : e.todayBilling ?? 0),
      0
    );
    const monthPaymentCollection = companyMonthEntries.reduce(
      (acc, e) => acc + (typeof e.paymentCollection === 'number' ? e.paymentCollection : 0),
      0
    );
    const monthOtherPayment = companyMonthEntries.reduce(
      (acc, e) => acc + (typeof e.otherPayment === 'number' ? e.otherPayment : 0),
      0
    );
    const monthPayment = companyMonthEntries.reduce(
      (acc, e) =>
        acc +
        (typeof e.todayPayment === 'number'
          ? e.todayPayment
          : (e.paymentCollection ?? 0) + (e.otherPayment ?? 0)),
      0
    );

    // Bill = Base bill + other bill (NO GST to be added)
    const monthTotalInvoicedBilling = monthBilling + monthOtherBilling;

    const collectionRate =
      monthTotalInvoicedBilling > 0
        ? Number(((monthPayment / monthTotalInvoicedBilling) * 100).toFixed(1))
        : 0;

    const daysCount = Math.max(1, new Set(companyMonthEntries.map((e) => e.date)).size);
    const avgDailyBilling = Math.round(monthTotalInvoicedBilling / daysCount);

    return {
      company,
      billing,
      otherBilling,
      billingWithGst,
      paymentCollection,
      otherPayment,
      todayBilling,
      todayPayment,
      monthBilling,
      monthOtherBilling,
      monthBillingWithGst,
      monthPaymentCollection,
      monthOtherPayment,
      monthPayment,
      hasEntryToday: Boolean(todayEntry),
      notes: todayEntry?.notes,
      paymentMode: todayEntry?.paymentMode,
      paymentReceivedAt: todayEntry?.paymentReceivedAt,
      lastUpdated: todayEntry?.submittedAt,
      collectionRate,
      avgDailyBilling,
    };
  });

  const grandTotal: GroupGrandTotal = {
    billing: summaries.reduce((acc, s) => acc + s.billing, 0),
    otherBilling: summaries.reduce((acc, s) => acc + s.otherBilling, 0),
    billingWithGst: summaries.reduce((acc, s) => acc + s.billingWithGst, 0),
    paymentCollection: summaries.reduce((acc, s) => acc + s.paymentCollection, 0),
    otherPayment: summaries.reduce((acc, s) => acc + s.otherPayment, 0),
    todayBilling: summaries.reduce((acc, s) => acc + s.todayBilling, 0),
    todayPayment: summaries.reduce((acc, s) => acc + s.todayPayment, 0),
    monthBilling: summaries.reduce((acc, s) => acc + s.monthBilling, 0),
    monthOtherBilling: summaries.reduce((acc, s) => acc + s.monthOtherBilling, 0),
    monthBillingWithGst: summaries.reduce((acc, s) => acc + s.monthBillingWithGst, 0),
    monthPaymentCollection: summaries.reduce((acc, s) => acc + s.monthPaymentCollection, 0),
    monthOtherPayment: summaries.reduce((acc, s) => acc + s.monthOtherPayment, 0),
    monthPayment: summaries.reduce((acc, s) => acc + s.monthPayment, 0),
    submittedCount: summaries.filter((s) => s.hasEntryToday).length,
    totalCompanies: summaries.length,
    collectionRate: 0,
  };

  const grandMonthTotalInvoicedBilling =
    grandTotal.monthBilling + grandTotal.monthOtherBilling;
  grandTotal.collectionRate =
    grandMonthTotalInvoicedBilling > 0
      ? Number(((grandTotal.monthPayment / grandMonthTotalInvoicedBilling) * 100).toFixed(1))
      : 0;

  return { summaries, grandTotal };
}
