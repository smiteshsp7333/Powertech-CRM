export type CompanyCategory = 'LASER' | 'PVD' | 'WORKS';

export interface GroupCompany {
  id: string;
  name: string;
  category: CompanyCategory;
  code: string;
  shortName?: string;
  location?: string;
  defaultUsername: string;
  defaultEmail: string;
}

export interface CompanyDailyEntry {
  id: string; // companyId_YYYY-MM-DD
  companyId: string;
  companyName: string;
  date: string; // YYYY-MM-DD
  billing: number; // Base Billing before GST (e.g. 100000)
  otherBilling: number; // Other Billing (e.g. 5000)
  billingWithGst: number; // Including GST (e.g. 118000)
  paymentCollection: number; // Payment Collection (e.g. 110000)
  otherPayment: number; // Other Payment (e.g. 5000)
  todayBilling: number; // Total Billing = billingWithGst + otherBilling
  todayPayment: number; // Total Payment = paymentCollection + otherPayment
  gstPayment?: number; // Legacy compatibility
  purchaseValue?: number; // Optional
  notes?: string;
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  paymentReceivedAt?: string;
  submittedBy?: string;
  submittedAt: string;
}

export interface CompanySummary {
  company: GroupCompany;
  billing: number; // Base Billing
  otherBilling: number; // Other Billing
  billingWithGst: number; // Including GST
  paymentCollection: number; // Payment Collection
  otherPayment: number; // Other Payment
  todayBilling: number;
  todayPayment: number;
  monthBilling: number;
  monthOtherBilling: number;
  monthBillingWithGst: number;
  monthPaymentCollection: number;
  monthOtherPayment: number;
  monthPayment: number;
  hasEntryToday: boolean;
  notes?: string;
  paymentMode?: string;
  paymentReceivedAt?: string;
  lastUpdated?: string;
  collectionRate: number;
  avgDailyBilling: number;
}

export interface GroupGrandTotal {
  billing: number;
  otherBilling: number;
  billingWithGst: number;
  paymentCollection: number;
  otherPayment: number;
  todayBilling: number;
  todayPayment: number;
  monthBilling: number;
  monthOtherBilling: number;
  monthBillingWithGst: number;
  monthPaymentCollection: number;
  monthOtherPayment: number;
  monthPayment: number;
  submittedCount: number;
  totalCompanies: number;
  collectionRate: number;
}

export interface UserSession {
  email: string;
  username: string;
  name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_USER';
  companyId?: string; // Assigned company for COMPANY_USER
  companyName?: string;
  token: string;
  loggedInAt: string;
}
