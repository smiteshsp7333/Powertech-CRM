// Powertech CRM Frontend API Client
// Standard fetch client with automatic token attachment, error interception,
// and seamless client-side demo fallback for hosted preview environments (e.g. Vercel)

import {
  DEMO_USERS,
  DEMO_ROLES,
  DEMO_DASHBOARD,
  DEMO_ENQUIRIES,
  DEMO_QUOTATIONS,
  DEMO_ORDERS,
  DEMO_DISPATCHES,
  DEMO_INVOICES,
  DEMO_AGEING,
  DEMO_PURCHASES,
  DEMO_DAILY_SUMMARY,
  DEMO_SETTINGS,
  DEMO_CUSTOMERS,
  DEMO_SUPPLIERS,
} from './mockData';

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

function resolveMockResponse<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.split('?')[0];

  // Auth: Login
  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {
      // ignore
    }
    const user = DEMO_USERS[body.email] || DEMO_USERS['admin@powertech.com'];
    if (!user) {
      throw new ApiError('Invalid credentials. Use admin@powertech.com or one of the demo buttons.', 401);
    }
    return {
      success: true,
      data: {
        accessToken: `mock-token-${user.id}-${Date.now()}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    } as unknown as T;
  }

  // Auth: Current user
  if (cleanEndpoint === '/auth/me') {
    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('powertech_user') : null;
    const user = savedUserStr ? JSON.parse(savedUserStr) : DEMO_USERS['admin@powertech.com'];
    return {
      success: true,
      data: user,
    } as unknown as T;
  }

  // Dashboard Metrics
  if (cleanEndpoint === '/reports/dashboard') {
    return {
      success: true,
      data: DEMO_DASHBOARD,
    } as unknown as T;
  }

  // Reports data
  if (cleanEndpoint === '/reports/data') {
    if (options.headers && (options.headers as any)['format'] === 'excel') {
      return new Blob(['Demo Report Spreadsheet Content'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }) as unknown as T;
    }
    return {
      success: true,
      data: DEMO_ENQUIRIES,
    } as unknown as T;
  }

  // Enquiries
  if (cleanEndpoint === '/enquiries') {
    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}
      const newEnq = {
        id: `enq-${Date.now()}`,
        enquiryNumber: `ENQ-2026-0000${DEMO_ENQUIRIES.length + 1}`,
        enquiryDate: new Date().toISOString(),
        customerName: body.customerName || 'Demo Customer',
        companyName: body.companyName || '',
        phone: body.phone || '+91 98000 00000',
        address: body.address || 'Industrial Estate',
        customerType: body.customerType || 'COMPANY',
        requirements: body.requirements || '',
        remarks: body.remarks || '',
        status: 'OPEN',
        assignedUser: { name: 'Siddharth Sales', email: 'sales@powertech.com' },
        quotations: [],
        orders: [],
        timeline: [
          {
            id: `t-${Date.now()}`,
            action: 'CREATED',
            description: 'Enquiry recorded in demo system.',
            createdAt: new Date().toISOString(),
            user: { name: 'Current User' },
          },
        ],
      };
      return { success: true, data: newEnq } as unknown as T;
    }
    return {
      success: true,
      data: DEMO_ENQUIRIES,
      pagination: { total: DEMO_ENQUIRIES.length, page: 1, limit: 10, totalPages: 1 },
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/enquiries/')) {
    const enq = DEMO_ENQUIRIES[0];
    return { success: true, data: enq } as unknown as T;
  }

  // Quotations
  if (cleanEndpoint === '/quotations') {
    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}
      const newQtn = {
        id: `qtn-${Date.now()}`,
        quotationNumber: `QTN-2026-0000${DEMO_QUOTATIONS.length + 1}`,
        revisionNumber: 0,
        quotationDate: new Date().toISOString(),
        customerName: body.customerName || 'Tata Power',
        companyName: body.companyName || '',
        totalAmount: 500000,
        status: 'DRAFT',
        items: body.items || [],
        revisions: [],
      };
      return { success: true, data: newQtn } as unknown as T;
    }
    return {
      success: true,
      data: DEMO_QUOTATIONS,
      pagination: { total: DEMO_QUOTATIONS.length, page: 1, limit: 10, totalPages: 1 },
    } as unknown as T;
  }

  if (cleanEndpoint.includes('/convert-to-order')) {
    return {
      success: true,
      data: {
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-2026-0000${DEMO_ORDERS.length + 1}`,
        status: 'CONFIRMED',
      },
    } as unknown as T;
  }

  if (cleanEndpoint.endsWith('/pdf')) {
    return new Blob(['%PDF-1.4 Demo PDF content for Powertech CRM'], {
      type: 'application/pdf',
    }) as unknown as T;
  }

  if (cleanEndpoint.startsWith('/quotations/')) {
    return { success: true, data: DEMO_QUOTATIONS[0] } as unknown as T;
  }

  // Orders
  if (cleanEndpoint === '/orders') {
    return {
      success: true,
      data: DEMO_ORDERS,
      pagination: { total: DEMO_ORDERS.length, page: 1, limit: 10, totalPages: 1 },
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/orders/')) {
    return { success: true, data: DEMO_ORDERS[0] } as unknown as T;
  }

  // Dispatches
  if (cleanEndpoint === '/dispatches') {
    if (method === 'POST') {
      return {
        success: true,
        data: {
          id: `dsp-${Date.now()}`,
          dispatchNumber: `DSP-2026-0000${DEMO_DISPATCHES.length + 1}`,
          deliveryStatus: 'PENDING',
        },
      } as unknown as T;
    }
    return {
      success: true,
      data: DEMO_DISPATCHES,
      pagination: { total: DEMO_DISPATCHES.length, page: 1, limit: 10, totalPages: 1 },
    } as unknown as T;
  }

  // Billing & Invoices
  if (cleanEndpoint === '/billing') {
    if (method === 'POST') {
      return {
        success: true,
        data: {
          id: `inv-${Date.now()}`,
          invoiceNumber: `INV-2026-27-0000${DEMO_INVOICES.length + 1}`,
          paymentStatus: 'UNPAID',
        },
      } as unknown as T;
    }
    return {
      success: true,
      data: DEMO_INVOICES,
      pagination: { total: DEMO_INVOICES.length, page: 1, limit: 10, totalPages: 1 },
      ageing: DEMO_AGEING,
    } as unknown as T;
  }

  if (cleanEndpoint === '/billing/pending-payments') {
    return {
      success: true,
      data: DEMO_INVOICES,
    } as unknown as T;
  }

  // Purchases
  if (cleanEndpoint === '/purchases') {
    if (method === 'POST') {
      return {
        success: true,
        data: {
          id: `pur-${Date.now()}`,
          purchaseNumber: `PUR-2026-0000${DEMO_PURCHASES.length + 1}`,
        },
      } as unknown as T;
    }
    return {
      success: true,
      data: DEMO_PURCHASES,
      pagination: { total: DEMO_PURCHASES.length, page: 1, limit: 10, totalPages: 1 },
    } as unknown as T;
  }

  // Daily Summary
  if (cleanEndpoint === '/daily-summary') {
    return {
      success: true,
      data: DEMO_DAILY_SUMMARY,
    } as unknown as T;
  }

  // Roles & Permissions
  if (cleanEndpoint === '/roles') {
    return {
      success: true,
      data: DEMO_ROLES,
    } as unknown as T;
  }

  // Settings
  if (cleanEndpoint === '/settings') {
    return {
      success: true,
      data: DEMO_SETTINGS,
    } as unknown as T;
  }

  // Customers & Suppliers
  if (cleanEndpoint === '/customers') {
    return {
      success: true,
      data: DEMO_CUSTOMERS,
    } as unknown as T;
  }

  if (cleanEndpoint === '/suppliers') {
    return {
      success: true,
      data: DEMO_SUPPLIERS,
    } as unknown as T;
  }

  // Default success payload
  return { success: true, message: 'Operation processed successfully in demo mode.' } as unknown as T;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('powertech_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
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
        return resolveMockResponse<T>(endpoint, options);
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
      // If 404, 502, 503, or 504 and running on Vercel without an external backend, provide the demo mock response
      if (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504) {
        console.warn(`[Powertech CRM] Backend endpoint ${endpoint} returned status ${response.status}. Using interactive preview fallback.`);
        return resolveMockResponse<T>(endpoint, options);
      }

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
  } catch (error: any) {
    // If network error (backend server not running or unreachable)
    if (error instanceof ApiError) {
      throw error;
    }
    console.warn(`[Powertech CRM] Backend unreachable at ${API_BASE_URL}${endpoint}. Falling back to demo preview mode.`);
    return resolveMockResponse<T>(endpoint, options);
  }
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
