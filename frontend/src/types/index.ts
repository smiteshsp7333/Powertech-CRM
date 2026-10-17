// Powertech CRM Frontend TypeScript Type Definitions

export type ModuleName =
  | 'ENQUIRY'
  | 'QUOTATION'
  | 'ORDER'
  | 'DISPATCH'
  | 'BILLING'
  | 'PURCHASE'
  | 'DAILY_SUMMARY'
  | 'REPORT'
  | 'USER_ROLE'
  | 'SETTING';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

export interface UserRolePermission {
  module: ModuleName;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  dataScope: 'OWN' | 'ALL';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  roleId: string;
  roleName: string;
  isSystem: boolean;
  permissions: UserRolePermission[];
}

export interface Customer {
  id: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
}

export interface Enquiry {
  id: string;
  enquiryNumber: string;
  enquiryDate: string;
  customerId?: string | null;
  customer?: Customer | null;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  customerName: string;
  phone: string;
  address?: string | null;
  requirements: string;
  remarks?: string | null;
  status: 'OPEN' | 'QUOTATION_PREPARED' | 'ORDER_PLACED' | 'CLOSED_LOST';
  assignedUserId?: string | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
  quotations?: Quotation[];
  orders?: Order[];
  timeline?: { id: string; action: string; description: string; performedBy: string; createdAt: string }[];
  _count?: { quotations: number; orders: number };
}

export interface QuotationItem {
  id?: string;
  itemDescription: string;
  specification?: string | null;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  sortOrder?: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  revisionNumber: number;
  fullNumber: string;
  enquiryId?: string | null;
  enquiry?: Enquiry | null;
  customerId: string;
  customer: Customer;
  quotationDate: string;
  validUntil?: string | null;
  subtotal: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  specificationNotes?: string | null;
  termsAndConditions?: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_ORDER';
  items: QuotationItem[];
  revisions?: { id: string; revisionNumber: number; fullNumber: string; reason?: string; createdAt: string }[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  itemDescription: string;
  specification?: string | null;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  dispatchedQty: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  enquiryId?: string | null;
  enquiry?: Enquiry | null;
  quotationId?: string | null;
  quotation?: Quotation | null;
  customerId: string;
  customer: Customer;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  agreedPaymentTerms?: string | null;
  dueDays: number;
  status:
    | 'PLACED'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'READY_FOR_DISPATCH'
    | 'DISPATCHED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  cancellationReason?: string | null;
  items: OrderItem[];
  dispatches?: Dispatch[];
  invoices?: Invoice[];
  completionPhotos?: CompletionPhoto[];
  createdAt: string;
  _count?: { dispatches: number; invoices: number; completionPhotos: number };
}

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  dispatchDate: string;
  orderId: string;
  order: Order;
  transportCourier?: string | null;
  trackingNumber?: string | null;
  deliveryAddress?: string | null;
  expectedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  actualDeliveryTime?: string | null;
  deliveryStatus: 'PENDING' | 'DISPATCHED' | 'DELIVERED' | 'DELAYED';
  remarks?: string | null;
  items: { id: string; orderItemId: string; orderItem: OrderItem; quantity: number }[];
  createdAt: string;
}

export interface CompletionPhoto {
  id: string;
  orderId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  thumbnailUrl?: string | null;
  uploadedBy?: { id: string; name: string };
  createdAt: string;
}

export interface InvoiceItem {
  id?: string;
  itemDescription: string;
  hsnSacCode?: string | null;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  paymentDate: string;
  paymentMode: string;
  amountReceived: number;
  referenceNumber?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  receivedBy?: { id: string; name: string };
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'SYSTEM_GENERATED' | 'RECORDED_EXTERNAL';
  billingDate: string;
  dueDate: string;
  orderId: string;
  order?: { id: string; orderNumber: string };
  customerId: string;
  customer: Customer;
  customerGstin?: string | null;
  placeOfSupply?: string | null;
  subtotal: number;
  discountAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountReceived: number;
  balanceAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  paymentTerms?: string | null;
  isLocked: boolean;
  creditNoteAmount: number;
  items: InvoiceItem[];
  payments?: Payment[];
  ageingBucket?: '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  supplierId: string;
  supplier: Supplier;
  supplierBillNo?: string | null;
  description: string;
  category?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID';
  billAttachmentPath?: string | null;
  createdAt: string;
}

export interface DailySummaryData {
  range: { startDate: string; endDate: string; view: string };
  totals: {
    billing: number;
    collection: number;
    purchase: number;
    adjustments: number;
    netCashFlow: number;
  };
  dailyRecords: {
    date: string;
    billingAmount: number;
    collectionAmount: number;
    purchaseAmount: number;
    adjustmentAmount: number;
    netCashFlow: number;
    isLocked: boolean;
    adjustments: any[];
  }[];
}
