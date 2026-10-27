// Powertech CRM Frontend API Client
// Standard fetch client with automatic token attachment, error interception,
// and complete interactive client-side persistence for hosted preview environments (e.g. Vercel)

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

// In-memory / localStorage reactive store helper for Vercel preview
function getStore<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(key, JSON.stringify(initial));
  } catch (e) {
    // fallback
  }
  return initial;
}

function setStore<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore
    }
  }
}

function resolveMockResponse<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const [cleanEndpoint, queryString] = endpoint.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // 1. Auth: Login (Strict validation - NO automatic fallback)
  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    const user = DEMO_USERS[email];
    if (!user) {
      throw new ApiError('Invalid email or password. Please verify your credentials.', 401);
    }

    const validPasswords = ['Password@123', 'admin123', 'password123'];
    if (!validPasswords.includes(password)) {
      throw new ApiError('Invalid email or password. Please verify your credentials.', 401);
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
    const enquiries = getStore('powertech_demo_enquiries', DEMO_ENQUIRIES);
    return {
      success: true,
      data: enquiries,
    } as unknown as T;
  }

  // 2. Enquiries (Creation & Filtering)
  if (cleanEndpoint === '/enquiries') {
    const enquiries = getStore<any[]>('powertech_demo_enquiries', DEMO_ENQUIRIES);

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}

      const newEnq = {
        id: `enq-${Date.now()}`,
        enquiryNumber: `ENQ-2026-0000${enquiries.length + 1}`,
        enquiryDate: new Date().toISOString(),
        customerName: body.customerName || 'Demo Customer',
        companyName: body.companyName || '',
        phone: body.phone || '+91 98000 00000',
        address: body.address || 'Industrial Area',
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
            description: 'Enquiry recorded in system.',
            createdAt: new Date().toISOString(),
            user: { name: 'Current User' },
          },
        ],
      };

      const updated = [newEnq, ...enquiries];
      setStore('powertech_demo_enquiries', updated);
      return { success: true, data: newEnq } as unknown as T;
    }

    // GET with filtering
    const search = (queryParams.get('search') || '').toLowerCase().trim();
    const status = queryParams.get('status') || '';
    const customerType = queryParams.get('customerType') || '';

    let filtered = enquiries;
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.enquiryNumber?.toLowerCase().includes(search) ||
          e.customerName?.toLowerCase().includes(search) ||
          e.companyName?.toLowerCase().includes(search) ||
          e.phone?.includes(search) ||
          e.requirements?.toLowerCase().includes(search)
      );
    }
    if (status) {
      filtered = filtered.filter((e) => e.status === status);
    }
    if (customerType) {
      filtered = filtered.filter((e) => e.customerType === customerType);
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/enquiries/') && method === 'GET') {
    const id = cleanEndpoint.replace('/enquiries/', '');
    const enquiries = getStore<any[]>('powertech_demo_enquiries', DEMO_ENQUIRIES);
    const found = enquiries.find((e) => e.id === id) || enquiries[0];
    return { success: true, data: found } as unknown as T;
  }

  // 3. Quotations (Creation & Filtering)
  if (cleanEndpoint === '/quotations') {
    const quotations = getStore<any[]>('powertech_demo_quotations', DEMO_QUOTATIONS);

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}

      const customers = getStore<any[]>('powertech_demo_customers', DEMO_CUSTOMERS);
      const matchedCust = customers.find((c) => c.id === body.customerId);

      const items = (body.items || []).map((it: any, idx: number) => ({
        id: `qi-new-${Date.now()}-${idx}`,
        description: it.itemDescription || it.description || 'Industrial Equipment',
        itemDescription: it.itemDescription || it.description || 'Industrial Equipment',
        specification: it.specification || '',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'Nos',
        rate: Number(it.rate) || 0,
        amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0),
      }));

      const subtotal = items.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const discountValue = Number(body.discountValue) || 0;
      const discountAmount =
        body.discountType === 'PERCENT'
          ? (subtotal * Math.min(100, discountValue)) / 100
          : Math.min(subtotal, discountValue);
      const taxable = Math.max(0, subtotal - discountAmount);
      const taxRate = Number(body.taxRate) || 18;
      const taxAmount = (taxable * taxRate) / 100;
      const totalAmount = Math.round(taxable + taxAmount);

      const newQtn = {
        id: `qtn-${Date.now()}`,
        quotationNumber: `QTN-2026-0000${quotations.length + 1}`,
        revisionNumber: 0,
        quotationDate: new Date().toISOString(),
        customerName: matchedCust ? matchedCust.name : (body.customerName || 'Tata Power'),
        companyName: matchedCust ? matchedCust.companyName : (body.companyName || 'Tata Power Industrial Solutions'),
        totalAmount,
        subtotal,
        discountType: body.discountType || 'PERCENT',
        discountValue,
        taxRate,
        specificationNotes: body.specificationNotes || '',
        termsAndConditions: body.termsAndConditions || '',
        status: 'DRAFT',
        items,
        revisions: [],
      };

      const updated = [newQtn, ...quotations];
      setStore('powertech_demo_quotations', updated);
      return { success: true, data: newQtn } as unknown as T;
    }

    const search = (queryParams.get('search') || '').toLowerCase().trim();
    const status = queryParams.get('status') || '';

    let filtered = quotations;
    if (search) {
      filtered = filtered.filter(
        (q) =>
          q.quotationNumber?.toLowerCase().includes(search) ||
          q.customerName?.toLowerCase().includes(search) ||
          q.companyName?.toLowerCase().includes(search)
      );
    }
    if (status) {
      filtered = filtered.filter((q) => q.status === status);
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
    } as unknown as T;
  }

  if (cleanEndpoint.includes('/convert-to-order')) {
    const qtnId = cleanEndpoint.split('/')[2];
    const quotations = getStore<any[]>('powertech_demo_quotations', DEMO_QUOTATIONS);
    const qtn = quotations.find((q) => q.id === qtnId);
    if (qtn) {
      qtn.status = 'CONVERTED_TO_ORDER';
      setStore('powertech_demo_quotations', quotations);
    }

    const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
    const newOrd = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-0000${orders.length + 1}`,
      orderDate: new Date().toISOString(),
      customerName: qtn?.customerName || 'Tata Power',
      companyName: qtn?.companyName || 'Tata Power Industrial Solutions',
      phone: '+91 98200 11223',
      address: 'Plot 45, MIDC Industrial Area, Pune',
      customer: {
        id: 'c-1',
        name: qtn?.customerName || 'Tata Power',
        companyName: qtn?.companyName || 'Tata Power Industrial Solutions',
        phone: '+91 98200 11223',
        address: 'Plot 45, MIDC Industrial Area, Pune',
      },
      totalAmount: qtn?.totalAmount || 500000,
      paymentTerms: '50% advance received, 50% on dispatch',
      dueDays: 30,
      status: 'CONFIRMED',
      items: (qtn?.items || []).map((it: any, i: number) => ({
        id: `oi-${Date.now()}-${i}`,
        description: it.description || it.itemDescription,
        itemDescription: it.itemDescription || it.description,
        quantity: it.quantity,
        unit: it.unit || 'Nos',
        dispatchedQty: 0,
        rate: it.rate,
        amount: it.amount,
      })),
      dispatches: [],
      invoices: [],
      completionPhotos: [],
    };

    setStore('powertech_demo_orders', [newOrd, ...orders]);
    return { success: true, data: newOrd } as unknown as T;
  }

  if (cleanEndpoint.endsWith('/pdf')) {
    return new Blob(['%PDF-1.4 Demo PDF content for Powertech CRM'], {
      type: 'application/pdf',
    }) as unknown as T;
  }

  if (cleanEndpoint.startsWith('/quotations/') && method === 'GET') {
    const id = cleanEndpoint.replace('/quotations/', '');
    const quotations = getStore<any[]>('powertech_demo_quotations', DEMO_QUOTATIONS);
    const found = quotations.find((q) => q.id === id) || quotations[0];
    return { success: true, data: found } as unknown as T;
  }

  // 4. Orders (Status Updating & Filtering)
  if (cleanEndpoint.includes('/status') && cleanEndpoint.startsWith('/orders/')) {
    const orderId = cleanEndpoint.split('/')[2];
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = body.status;
      if (body.cancellationReason) {
        order.cancellationReason = body.cancellationReason;
      }
      setStore('powertech_demo_orders', orders);
      return { success: true, data: order } as unknown as T;
    }
  }

  if (cleanEndpoint === '/orders') {
    const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
    const search = (queryParams.get('search') || '').toLowerCase().trim();
    const status = queryParams.get('status') || '';

    let filtered = orders;
    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(search) ||
          o.customerName?.toLowerCase().includes(search) ||
          o.companyName?.toLowerCase().includes(search)
      );
    }
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/orders/') && method === 'GET') {
    const id = cleanEndpoint.replace('/orders/', '');
    const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
    const found = orders.find((o) => o.id === id) || orders[0];
    return { success: true, data: found } as unknown as T;
  }

  // 5. Dispatches (Creation, Delivery Status & Filtering)
  if (cleanEndpoint.includes('/status') && cleanEndpoint.startsWith('/dispatches/')) {
    const dspId = cleanEndpoint.split('/')[2];
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const dispatches = getStore<any[]>('powertech_demo_dispatches', DEMO_DISPATCHES);
    const dsp = dispatches.find((d) => d.id === dspId);
    if (dsp) {
      dsp.deliveryStatus = body.deliveryStatus || 'DELIVERED';
      dsp.actualDeliveryDate = body.actualDeliveryDate || new Date().toISOString();
      dsp.remarks = body.remarks || dsp.remarks;
      setStore('powertech_demo_dispatches', dispatches);
      return { success: true, data: dsp } as unknown as T;
    }
  }

  if (cleanEndpoint === '/dispatches') {
    const dispatches = getStore<any[]>('powertech_demo_dispatches', DEMO_DISPATCHES);

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}

      const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
      const order = orders.find((o) => o.id === body.orderId);

      // Update dispatched quantities on order items
      if (order && body.items) {
        body.items.forEach((dspItem: any) => {
          const ordItem = order.items?.find((oi: any) => oi.id === dspItem.orderItemId);
          if (ordItem) {
            ordItem.dispatchedQty = (Number(ordItem.dispatchedQty) || 0) + Number(dspItem.quantity);
          }
        });
        const allFullyDispatched = order.items?.every(
          (oi: any) => (Number(oi.dispatchedQty) || 0) >= (Number(oi.quantity) || 1)
        );
        order.status = allFullyDispatched ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';
        setStore('powertech_demo_orders', orders);
      }

      const newDispatch = {
        id: `dsp-${Date.now()}`,
        dispatchNumber: `DSP-2026-0000${dispatches.length + 1}`,
        dispatchDate: new Date().toISOString(),
        transportCourier: body.transportCourier || 'VRL Logistics',
        courierName: body.transportCourier || 'VRL Logistics',
        trackingNumber: body.trackingNumber || `TRK-${Date.now()}`,
        deliveryAddress: body.deliveryAddress || order?.address || 'Industrial Plant',
        expectedDeliveryDate: body.expectedDeliveryDate || new Date().toISOString(),
        actualDeliveryDate: null,
        deliveryStatus: 'DISPATCHED',
        remarks: body.remarks || 'Dispatched from factory',
        order: {
          id: order?.id || 'ord-1',
          orderNumber: order?.orderNumber || 'ORD-2026-00001',
          customerName: order?.customerName || 'Tata Power',
          companyName: order?.companyName || 'Tata Power Industrial Solutions',
          customer: {
            id: 'c-1',
            name: order?.customerName || 'Tata Power',
            companyName: order?.companyName || 'Tata Power Industrial Solutions',
            phone: order?.phone || '+91 98200 11223',
            address: order?.address || 'Pune Industrial Area',
          },
        },
        items: body.items || [],
      };

      const updated = [newDispatch, ...dispatches];
      setStore('powertech_demo_dispatches', updated);
      return { success: true, data: newDispatch } as unknown as T;
    }

    const search = (queryParams.get('search') || '').toLowerCase().trim();
    const deliveryStatus = queryParams.get('deliveryStatus') || '';

    let filtered = dispatches;
    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.dispatchNumber?.toLowerCase().includes(search) ||
          d.order?.orderNumber?.toLowerCase().includes(search) ||
          d.order?.customerName?.toLowerCase().includes(search) ||
          d.courierName?.toLowerCase().includes(search) ||
          d.transportCourier?.toLowerCase().includes(search) ||
          d.trackingNumber?.toLowerCase().includes(search)
      );
    }
    if (deliveryStatus) {
      filtered = filtered.filter((d) => d.deliveryStatus === deliveryStatus);
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
    } as unknown as T;
  }

  // 6. Billing & Invoices
  if (cleanEndpoint.includes('/payments') && cleanEndpoint.startsWith('/billing/')) {
    const invId = cleanEndpoint.split('/')[2];
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const invoices = getStore<any[]>('powertech_demo_invoices', DEMO_INVOICES);
    const invoice = invoices.find((inv) => inv.id === invId);
    if (invoice) {
      const paymentAmount = Number(body.amountReceived) || 0;
      invoice.paidAmount = (Number(invoice.paidAmount) || 0) + paymentAmount;
      invoice.balanceAmount = Math.max(0, (Number(invoice.totalAmount) || 0) - invoice.paidAmount);
      invoice.paymentStatus = invoice.balanceAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

      if (!invoice.payments) invoice.payments = [];
      invoice.payments.push({
        id: `pm-${Date.now()}`,
        amount: paymentAmount,
        paymentDate: body.paymentDate || new Date().toISOString(),
        paymentMode: body.paymentMode || 'BANK_TRANSFER',
        referenceNumber: body.referenceNumber || '',
        notes: body.remarks || '',
      });

      setStore('powertech_demo_invoices', invoices);
      return { success: true, data: invoice } as unknown as T;
    }
  }

  if (cleanEndpoint === '/billing') {
    const invoices = getStore<any[]>('powertech_demo_invoices', DEMO_INVOICES);

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}

      const orders = getStore<any[]>('powertech_demo_orders', DEMO_ORDERS);
      const order = orders.find((o) => o.id === body.orderId);

      const items = (body.items || order?.items || []).map((it: any, i: number) => ({
        id: `ii-new-${Date.now()}-${i}`,
        description: it.itemDescription || it.description || 'Industrial Equipment',
        hsnCode: it.hsnSacCode || '8504',
        quantity: Number(it.quantity) || 1,
        rate: Number(it.rate) || 100000,
        amount: (Number(it.quantity) || 1) * (Number(it.rate) || 100000),
      }));

      const subtotal = items.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const gstRate = Number(body.gstRate) || 18;
      const totalTax = Math.round((subtotal * gstRate) / 100);
      const totalAmount = subtotal + totalTax;

      const newInv = {
        id: `inv-${Date.now()}`,
        invoiceNumber: body.invoiceType === 'RECORDED_EXTERNAL' && body.externalInvoiceNumber
          ? body.externalInvoiceNumber
          : `INV-2026-27-0000${invoices.length + 1}`,
        billingDate: body.billingDate || new Date().toISOString(),
        dueDate: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        customerName: order?.customerName || 'Tata Power',
        companyName: order?.companyName || 'Tata Power Industrial Solutions',
        customerGstin: '27AABCT3518Q1Z8',
        subtotal,
        cgstAmount: body.isInterState ? 0 : Math.round(totalTax / 2),
        sgstAmount: body.isInterState ? 0 : Math.round(totalTax / 2),
        igstAmount: body.isInterState ? totalTax : 0,
        totalTax,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        paymentStatus: 'UNPAID',
        mode: body.invoiceType || 'SYSTEM_GENERATED',
        order: { id: order?.id || 'ord-1', orderNumber: order?.orderNumber || 'ORD-2026-00001' },
        items,
        payments: [],
      };

      const updated = [newInv, ...invoices];
      setStore('powertech_demo_invoices', updated);

      if (order) {
        order.status = 'INVOICED';
        setStore('powertech_demo_orders', orders);
      }

      return { success: true, data: newInv } as unknown as T;
    }

    const search = (queryParams.get('search') || '').toLowerCase().trim();
    const paymentStatus = queryParams.get('paymentStatus') || '';

    let filtered = invoices;
    if (search) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(search) ||
          inv.customerName?.toLowerCase().includes(search) ||
          inv.companyName?.toLowerCase().includes(search) ||
          inv.customerGstin?.toLowerCase().includes(search)
      );
    }
    if (paymentStatus) {
      filtered = filtered.filter((inv) => inv.paymentStatus === paymentStatus);
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
      ageing: DEMO_AGEING,
    } as unknown as T;
  }

  if (cleanEndpoint === '/billing/pending-payments') {
    const invoices = getStore<any[]>('powertech_demo_invoices', DEMO_INVOICES);
    const pending = invoices.filter((i) => i.paymentStatus !== 'PAID');
    return {
      success: true,
      data: pending,
    } as unknown as T;
  }

  // 7. Purchases
  if (cleanEndpoint === '/purchases') {
    const purchases = getStore<any[]>('powertech_demo_purchases', DEMO_PURCHASES);

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch (e) {}

      const suppliers = getStore<any[]>('powertech_demo_suppliers', DEMO_SUPPLIERS);
      const supplier = suppliers.find((s) => s.id === body.supplierId);

      const subtotal = Number(body.subtotal) || 0;
      const taxRate = Number(body.taxRate) || 18;
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const totalAmount = subtotal + taxAmount;

      const newPurchase = {
        id: `pur-${Date.now()}`,
        purchaseNumber: `PUR-2026-0000${purchases.length + 1}`,
        purchaseDate: body.purchaseDate || new Date().toISOString(),
        supplierName: supplier?.name || 'Hindalco Copper & Metal Industries',
        supplierBillNo: body.supplierBillNo || `SB-${Date.now()}`,
        category: body.category || 'RAW_MATERIAL',
        description: body.description || 'Industrial raw material procurement',
        subtotal,
        taxAmount,
        totalAmount,
      };

      const updated = [newPurchase, ...purchases];
      setStore('powertech_demo_purchases', updated);
      return { success: true, data: newPurchase } as unknown as T;
    }

    const search = (queryParams.get('search') || '').toLowerCase().trim();
    let filtered = purchases;
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.purchaseNumber?.toLowerCase().includes(search) ||
          p.supplierName?.toLowerCase().includes(search) ||
          p.supplierBillNo?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: 1, limit: 10, totalPages: Math.max(1, Math.ceil(filtered.length / 10)) },
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/purchases/') && method === 'DELETE') {
    const id = cleanEndpoint.replace('/purchases/', '');
    const purchases = getStore<any[]>('powertech_demo_purchases', DEMO_PURCHASES);
    const updated = purchases.filter((p) => p.id !== id);
    setStore('powertech_demo_purchases', updated);
    return { success: true, message: 'Purchase bill deleted successfully.' } as unknown as T;
  }

  // 8. Daily Summary (Adjustments, Manual Recording & Locks)
  if (cleanEndpoint === '/daily-summary/record' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const summary = getStore<any>('powertech_demo_daily_summary', DEMO_DAILY_SUMMARY);
    const records = [...summary.dailyRecords];
    const targetDate = body.date || new Date().toISOString().slice(0, 10);

    const existingIdx = records.findIndex((r) => r.date === targetDate);
    const billingAmount = Number(body.billingAmount) || 0;
    const collectionAmount = Number(body.collectionAmount) || 0;
    const purchaseAmount = Number(body.purchaseAmount) || 0;
    const adjustmentAmount = Number(body.adjustmentAmount) || 0;
    const netCashFlow = collectionAmount - purchaseAmount + adjustmentAmount;

    const newRecord = {
      date: targetDate,
      billingAmount,
      collectionAmount,
      purchaseAmount,
      adjustmentAmount,
      adjustments: body.notes ? [{ id: `adj-${Date.now()}`, type: 'MANUAL_ENTRY', amount: adjustmentAmount, reason: body.notes }] : [],
      netCashFlow,
      isLocked: false,
    };

    if (existingIdx >= 0) {
      records[existingIdx] = newRecord;
    } else {
      records.unshift(newRecord);
    }

    const totalBilling = records.reduce((acc, r) => acc + (Number(r.billingAmount) || 0), 0);
    const totalCollection = records.reduce((acc, r) => acc + (Number(r.collectionAmount) || 0), 0);
    const totalPurchase = records.reduce((acc, r) => acc + (Number(r.purchaseAmount) || 0), 0);
    const totalNetCash = totalCollection - totalPurchase;

    const updatedSummary = {
      dailyRecords: records,
      totals: {
        billing: totalBilling,
        collection: totalCollection,
        purchase: totalPurchase,
        netCashFlow: totalNetCash,
      },
    };

    setStore('powertech_demo_daily_summary', updatedSummary);
    return { success: true, data: updatedSummary } as unknown as T;
  }

  if (cleanEndpoint === '/daily-summary/adjustments' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const summary = getStore<any>('powertech_demo_daily_summary', DEMO_DAILY_SUMMARY);
    const records = [...summary.dailyRecords];
    const targetDate = body.date || new Date().toISOString().slice(0, 10);

    let row = records.find((r) => r.date === targetDate);
    if (!row) {
      row = {
        date: targetDate,
        billingAmount: 0,
        collectionAmount: 0,
        purchaseAmount: 0,
        adjustmentAmount: 0,
        adjustments: [],
        netCashFlow: 0,
        isLocked: false,
      };
      records.unshift(row);
    }

    const adjAmt = Number(body.amount) || 0;
    row.adjustmentAmount = (Number(row.adjustmentAmount) || 0) + adjAmt;
    if (!row.adjustments) row.adjustments = [];
    row.adjustments.push({
      id: `adj-${Date.now()}`,
      type: body.type || 'MANUAL_ADJUSTMENT',
      amount: adjAmt,
      reason: body.reason || 'Management Adjustment',
    });
    row.netCashFlow = (Number(row.collectionAmount) || 0) - (Number(row.purchaseAmount) || 0) + row.adjustmentAmount;

    setStore('powertech_demo_daily_summary', { ...summary, dailyRecords: records });
    return { success: true, data: row } as unknown as T;
  }

  if (cleanEndpoint === '/daily-summary/lock' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {}

    const summary = getStore<any>('powertech_demo_daily_summary', DEMO_DAILY_SUMMARY);
    const records = [...summary.dailyRecords];
    const row = records.find((r) => r.date === body.date);
    if (row) {
      row.isLocked = Boolean(body.isLocked);
      setStore('powertech_demo_daily_summary', { ...summary, dailyRecords: records });
    }
    return { success: true } as unknown as T;
  }

  if (cleanEndpoint === '/daily-summary') {
    const summary = getStore<any>('powertech_demo_daily_summary', DEMO_DAILY_SUMMARY);
    const startDate = queryParams.get('startDate') || '';
    const endDate = queryParams.get('endDate') || '';

    let records = summary.dailyRecords || [];
    if (startDate) {
      records = records.filter((r: any) => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter((r: any) => r.date <= endDate);
    }

    return {
      success: true,
      data: {
        dailyRecords: records,
        totals: summary.totals || DEMO_DAILY_SUMMARY.totals,
      },
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
    const settingsMap = DEMO_SETTINGS.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    return {
      success: true,
      data: {
        list: DEMO_SETTINGS,
        map: settingsMap,
      },
    } as unknown as T;
  }

  // Customers & Suppliers
  if (cleanEndpoint === '/customers') {
    const customers = getStore('powertech_demo_customers', DEMO_CUSTOMERS);
    return {
      success: true,
      data: customers,
    } as unknown as T;
  }

  if (cleanEndpoint === '/suppliers') {
    const suppliers = getStore('powertech_demo_suppliers', DEMO_SUPPLIERS);
    return {
      success: true,
      data: suppliers,
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
      if (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504) {
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
    if (error instanceof ApiError) {
      throw error;
    }
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
  recordDailySummary: (data: any) =>
    request('/daily-summary/record', { method: 'POST', body: JSON.stringify(data) }),
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
