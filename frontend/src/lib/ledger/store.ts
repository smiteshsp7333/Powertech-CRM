import { CompanyDailyEntry, CompanySummary, GroupGrandTotal } from '../../types/ledger';
import { GROUP_COMPANIES } from './companies';

const STORAGE_KEY = 'group_billing_ledger_prod_v1';

// Clean production initialization - zero dummy data for live usage
const SEED_ENTRIES: CompanyDailyEntry[] = [];

export function loadAllEntries(): Record<string, CompanyDailyEntry> {
  if (typeof window === 'undefined') {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((e) => {
      map[e.id] = e;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return map;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    const map: Record<string, CompanyDailyEntry> = {};
    SEED_ENTRIES.forEach((entry) => {
      map[entry.id] = entry;
    });
    return map;
  }
}

export function saveCompanyDailyEntry(entry: CompanyDailyEntry): void {
  if (typeof window === 'undefined') return;

  const all = loadAllEntries();
  const key = `${entry.companyId}_${entry.date}`;
  all[key] = {
    ...entry,
    id: key,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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
  const targetMonthPrefix = targetDate.slice(0, 7); // e.g. "2026-10"

  const allEntriesList = Object.values(entriesMap);

  const summaries: CompanySummary[] = GROUP_COMPANIES.map((company) => {
    const todayKey = `${company.id}_${targetDate}`;
    const todayEntry = entriesMap[todayKey];

    const companyMonthEntries = allEntriesList.filter(
      (e) => e.companyId === company.id && e.date.startsWith(targetMonthPrefix)
    );

    const billing = todayEntry?.billing || 0;
    const otherBilling = todayEntry?.otherBilling || 0;
    const billingWithGst =
      todayEntry?.billingWithGst || (billing > 0 ? Math.round(billing * 1.18) : todayEntry?.todayBilling || 0);
    const paymentCollection =
      todayEntry?.paymentCollection ||
      (todayEntry ? Math.round(todayEntry.todayPayment * 0.95) : 0);
    const otherPayment =
      todayEntry?.otherPayment ||
      (todayEntry ? Math.round(todayEntry.todayPayment * 0.05) : 0);
    const todayBilling = todayEntry?.todayBilling || billingWithGst + otherBilling;
    const todayPayment = todayEntry?.todayPayment || paymentCollection + otherPayment;

    const monthBilling = companyMonthEntries.reduce(
      (acc, e) => acc + (e.billing || Math.round(e.todayBilling / 1.18)),
      0
    );
    const monthOtherBilling = companyMonthEntries.reduce(
      (acc, e) => acc + (e.otherBilling || 0),
      0
    );
    const monthBillingWithGst = companyMonthEntries.reduce(
      (acc, e) => acc + (e.billingWithGst || e.todayBilling),
      0
    );
    const monthPaymentCollection = companyMonthEntries.reduce(
      (acc, e) => acc + (e.paymentCollection || Math.round(e.todayPayment * 0.95)),
      0
    );
    const monthOtherPayment = companyMonthEntries.reduce(
      (acc, e) => acc + (e.otherPayment || Math.round(e.todayPayment * 0.05)),
      0
    );
    const monthPayment = companyMonthEntries.reduce(
      (acc, e) => acc + e.todayPayment,
      0
    );

    const collectionRate =
      monthBillingWithGst > 0
        ? Number(((monthPayment / monthBillingWithGst) * 100).toFixed(1))
        : 0;

    const daysCount = Math.max(1, new Set(companyMonthEntries.map((e) => e.date)).size);
    const avgDailyBilling = Math.round(monthBillingWithGst / daysCount);

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

  grandTotal.collectionRate =
    grandTotal.monthBillingWithGst > 0
      ? Number(((grandTotal.monthPayment / grandTotal.monthBillingWithGst) * 100).toFixed(1))
      : 0;

  return { summaries, grandTotal };
}
