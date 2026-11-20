// Powertech CRM Demo & Offline Mock Engine
// Powers interactive evaluation on Vercel preview environments when backend is not connected

export const DEMO_ROLES = [
  {
    id: 'role-admin',
    name: 'Super Admin',
    description: 'Unrestricted access to all modules, records, user management, and system configuration.',
    isSystem: true,
    permissions: [
      { module: 'ENQUIRY', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'QUOTATION', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'ORDER', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'DISPATCH', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'BILLING', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'PURCHASE', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'DAILY_SUMMARY', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'REPORT', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'USER_ROLE', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'SETTING', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
    ],
  },
  {
    id: 'role-sales',
    name: 'Sales',
    description: 'Manages customer enquiries, quotes, pricing, and converts orders.',
    isSystem: false,
    permissions: [
      { module: 'ENQUIRY', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'QUOTATION', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'ORDER', canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, dataScope: 'ALL' },
      { module: 'DISPATCH', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'BILLING', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'PURCHASE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'DAILY_SUMMARY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
    ],
  },
  {
    id: 'role-operations',
    name: 'Operations/Dispatch',
    description: 'Coordinates order fulfillment, tracking, partial dispatches, and delivery proofs.',
    isSystem: false,
    permissions: [
      { module: 'ENQUIRY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'QUOTATION', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'ORDER', canView: true, canCreate: false, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'DISPATCH', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'BILLING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'PURCHASE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'DAILY_SUMMARY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
    ],
  },
  {
    id: 'role-accounts',
    name: 'Accounts',
    description: 'Generates invoices, records receipts, tracks outstanding ageing, and reviews daily collections.',
    isSystem: false,
    permissions: [
      { module: 'ENQUIRY', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'QUOTATION', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'ORDER', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'DISPATCH', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'BILLING', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'PURCHASE', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'DAILY_SUMMARY', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
    ],
  },
  {
    id: 'role-purchase',
    name: 'Purchase',
    description: 'Manages suppliers, procurement entries, and supplier bills.',
    isSystem: false,
    permissions: [
      { module: 'ENQUIRY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'QUOTATION', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'ORDER', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'DISPATCH', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'BILLING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'PURCHASE', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'DAILY_SUMMARY', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
      { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
      { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
    ],
  },
];

export const DEMO_USERS: Record<string, any> = {
  'admin@powertechlaser.in': {
    id: 'user-admin-ptl',
    name: 'Super Admin',
    email: 'admin@powertechlaser.in',
    phone: '+91 98000 00001',
    password: 'Admin@PTL2026',
    role: DEMO_ROLES[0],
  },
  'dubai@3050': {
    id: 'user-admin',
    name: 'Super Admin User',
    email: 'dubai@3050',
    phone: '+91 98000 00001',
    password: 'Defe@6126',
    role: DEMO_ROLES[0],
  },
  'admin@powertech.com': {
    id: 'user-admin',
    name: 'Super Admin User',
    email: 'admin@powertech.com',
    phone: '+91 98000 00001',
    password: 'Admin@PTL2026',
    role: DEMO_ROLES[0],
  },
  'sales@powertechlaser.in': {
    id: 'user-sales-ptl',
    name: 'Siddharth Sales',
    email: 'sales@powertechlaser.in',
    phone: '+91 98000 00002',
    password: 'Sales@PTL2026',
    role: DEMO_ROLES[1],
  },
  'sales@powertech.com': {
    id: 'user-sales',
    name: 'Siddharth Sales',
    email: 'sales@powertech.com',
    phone: '+91 98000 00002',
    password: 'Sales@PTL2026',
    role: DEMO_ROLES[1],
  },
  'production@powertechlaser.in': {
    id: 'user-prod-ptl',
    name: 'Omkar Production',
    email: 'production@powertechlaser.in',
    phone: '+91 98000 00003',
    password: 'Prod@PTL2026',
    role: DEMO_ROLES[2],
  },
  'operations@powertech.com': {
    id: 'user-ops',
    name: 'Omkar Operations',
    email: 'operations@powertech.com',
    phone: '+91 98000 00003',
    password: 'Prod@PTL2026',
    role: DEMO_ROLES[2],
  },
  'accounts@powertechlaser.in': {
    id: 'user-accounts-ptl',
    name: 'Ananya Accounts',
    email: 'accounts@powertechlaser.in',
    phone: '+91 98000 00004',
    password: 'Accounts@PTL2026',
    role: DEMO_ROLES[3],
  },
  'accounts@powertech.com': {
    id: 'user-accounts',
    name: 'Ananya Accounts',
    email: 'accounts@powertech.com',
    phone: '+91 98000 00004',
    password: 'Accounts@PTL2026',
    role: DEMO_ROLES[3],
  },
  'dispatch@powertechlaser.in': {
    id: 'user-dispatch-ptl',
    name: 'Ramesh Dispatch',
    email: 'dispatch@powertechlaser.in',
    phone: '+91 98000 00005',
    password: 'Dispatch@PTL2026',
    role: DEMO_ROLES[2],
  },
  'purchase@powertech.com': {
    id: 'user-purchase',
    name: 'Prakash Purchase',
    email: 'purchase@powertech.com',
    phone: '+91 98000 00005',
    password: 'Password@123',
    role: DEMO_ROLES[4],
  },
};

export const DEMO_DASHBOARD = {
  cards: {
    totalEnquiries: 0,
    totalQuotations: 0,
    confirmedOrders: 0,
    pendingDispatches: 0,
    pendingDeliveries: 0,
    pendingPayments: 0,
    pendingPaymentsAmount: 0,
    pendingPaymentsCount: 0,
    totalBilling: 0,
    totalCollections: 0,
    totalPurchases: 0,
  },
  monthlyTrend: [],
  monthlyRevenue: [],
  funnelData: [],
};

export const DEMO_ENQUIRIES: any[] = [];

export const DEMO_QUOTATIONS: any[] = [];

export const DEMO_ORDERS: any[] = [];

export const DEMO_DISPATCHES: any[] = [];

export const DEMO_INVOICES: any[] = [];

export const DEMO_AGEING = {
  bucket0to30: 0,
  bucket31to60: 0,
  bucket61to90: 0,
  bucket90Plus: 0,
  totalOutstanding: 0,
};

export const DEMO_PURCHASES: any[] = [];

export const DEMO_DAILY_SUMMARY = {
  dailyRecords: [],
  totals: {
    billing: 0,
    collection: 0,
    purchase: 0,
    totalBilling: 0,
    totalCollections: 0,
    totalPurchases: 0,
    adjustments: 0,
    netCashFlow: 0,
  },
};

export const DEMO_SETTINGS = [
  { key: 'COMPANY_NAME', value: 'Powertech Industrial Solutions Pvt Ltd', description: 'Registered business name' },
  { key: 'COMPANY_GSTIN', value: '27AABCP8877K1Z4', description: 'Registered GST Identification Number' },
  { key: 'DEFAULT_TAX_RATE', value: '18', description: 'Standard GST tax rate percentage' },
  { key: 'INVOICE_MODE_DEFAULT', value: 'GENERATED', description: 'Default billing mode: GENERATED or RECORDED' },
  { key: 'BANK_NAME', value: 'HDFC Bank Ltd', description: 'Remittance bank' },
  { key: 'BANK_ACCOUNT_NO', value: '50200088991122', description: 'Current account number' },
  { key: 'BANK_IFSC', value: 'HDFC0000123', description: 'Bank IFSC routing code' },
];

export const DEMO_CUSTOMERS: any[] = [];

export const DEMO_SUPPLIERS: any[] = [];
