// Powertech CRM Frontend API Client
// Standard fetch client with automatic token attachment and error interception

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('powertech_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set json content type unless FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle file downloads directly
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ) {
    if (!response.ok) {
      throw new ApiError('Failed to generate export file.', response.status);
    }
    return (await response.blob()) as unknown as T;
  }

  let jsonResult: any = {};
  try {
    jsonResult = await response.json();
  } catch (err) {
    // Non-json response
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('powertech_token');
      localStorage.removeItem('powertech_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(jsonResult.error || `Request failed with status ${response.status}`, response.status, jsonResult);
  }

  return jsonResult;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard & Reports
  getDashboardMetrics: () => request('/reports/dashboard'),
  getReportData: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/data?${query}`);
  },
  downloadReportExcel: (reportType: string, params: Record<string, string> = {}) => {
    const query = new URLSearchParams({ ...params, reportType, format: 'excel' }).toString();
    return request<Blob>(`/reports/data?${query}`);
  },

  // Enquiries
  getEnquiries: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/enquiries?${query}`);
  },
  getEnquiryById: (id: string) => request(`/enquiries/${id}`),
  createEnquiry: (data: any) => request('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (id: string, data: any) => request(`/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEnquiry: (id: string) => request(`/enquiries/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/quotations?${query}`);
  },
  getQuotationById: (id: string) => request(`/quotations/${id}`),
  createQuotation: (data: any) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateQuotationRevision: (id: string, data: any) =>
    request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  convertToOrder: (id: string, data: any) =>
    request(`/quotations/${id}/convert-to-order`, { method: 'POST', body: JSON.stringify(data) }),
  downloadQuotationPdf: (id: string) => request<Blob>(`/quotations/${id}/pdf`),
  deleteQuotation: (id: string) => request(`/quotations/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders?${query}`);
  },
  getOrderById: (id: string) => request(`/orders/${id}`),
  createOrder: (data: any) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, data: { status: string; cancellationReason?: string }) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOrder: (id: string) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Dispatches
  getDispatches: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dispatches?${query}`);
  },
  createDispatch: (data: any) => request('/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  updateDeliveryStatus: (id: string, data: any) =>
    request(`/dispatches/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  uploadOrderPhotos: (orderId: string, formData: FormData) =>
    request(`/dispatches/orders/${orderId}/photos`, { method: 'POST', body: formData }),
  deleteCompletionPhoto: (photoId: string, deleteReason?: string) =>
    request(`/dispatches/photos/${photoId}`, { method: 'DELETE', body: JSON.stringify({ deleteReason }) }),

  // Billing & Payments
  getInvoices: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/billing?${query}`);
  },
  getPendingPayments: () => request('/billing/pending-payments'),
  createInvoice: (data: any) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (invoiceId: string, data: any) =>
    request(`/billing/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  addCreditNote: (invoiceId: string, data: any) =>
    request(`/billing/${invoiceId}/credit-note`, { method: 'POST', body: JSON.stringify(data) }),
  downloadInvoicePdf: (id: string) => request<Blob>(`/billing/${id}/pdf`),

  // Purchases
  getPurchases: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases?${query}`);
  },
  createPurchase: (data: any) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  deletePurchase: (id: string) => request(`/purchases/${id}`, { method: 'DELETE' }),

  // Daily Summary
  getDailySummary: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/daily-summary?${query}`);
  },
  addAdjustment: (data: any) =>
    request('/daily-summary/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  toggleDayLock: (data: { date: string; isLocked: boolean; notes?: string }) =>
    request('/daily-summary/lock', { method: 'POST', body: JSON.stringify(data) }),

  // Roles & Permissions
  getRoles: () => request('/roles'),
  getRoleById: (id: string) => request(`/roles/${id}`),
  updateRolePermissions: (id: string, data: any) =>
    request(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers & Suppliers
  getCustomers: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers?${query}`);
  },
  createCustomer: (data: any) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/suppliers?${query}`);
  },
  createSupplier: (data: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings: { key: string; value: string }[]) =>
    request('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
};
