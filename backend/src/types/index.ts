// Powertech ERP & CRM Type Definitions

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

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export';

export type DataScope = 'OWN' | 'ALL';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  roleId: string;
  roleName: string;
  isSystem: boolean;
  permissions: {
    module: ModuleName;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    dataScope: DataScope;
  }[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export type EnquiryStatus =
  | 'OPEN'
  | 'QUOTATION_PREPARED'
  | 'ORDER_PLACED'
  | 'CLOSED_LOST';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONVERTED_TO_ORDER';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'DELAYED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE';

export type PaymentMode =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CHEQUE'
  | 'CARD'
  | 'OTHER';
