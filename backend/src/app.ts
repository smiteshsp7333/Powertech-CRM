import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes';
import enquiryRoutes from './routes/enquiry.routes';
import quotationRoutes from './routes/quotation.routes';
import orderRoutes from './routes/order.routes';
import dispatchRoutes from './routes/dispatch.routes';
import billingRoutes from './routes/billing.routes';
import purchaseRoutes from './routes/purchase.routes';
import dailySummaryRoutes from './routes/dailySummary.routes';
import reportRoutes from './routes/report.routes';
import roleRoutes from './routes/role.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import settingRoutes from './routes/setting.routes';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Swagger Documentation Specification
const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Powertech ERP & CRM REST API',
    version: '1.0.0',
    description: 'Production OpenAPI documentation for Powertech ERP lifecycle (Enquiry, Quotation, Order, Dispatch, Billing, Purchase, Daily Summary, Reports)',
  },
  servers: [{ url: '/api', description: 'API Gateway' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        responses: { 200: { description: 'Tokens issued successfully' } },
      },
    },
    '/enquiries': {
      get: { summary: 'List customer enquiries with search and filters', tags: ['Enquiry'] },
      post: { summary: 'Create a new customer enquiry', tags: ['Enquiry'] },
    },
    '/quotations': {
      get: { summary: 'List quotations with filters', tags: ['Quotation'] },
      post: { summary: 'Create commercial quotation against enquiry', tags: ['Quotation'] },
    },
    '/orders': {
      get: { summary: 'List customer orders', tags: ['Order'] },
      post: { summary: 'Create direct order or convert from quotation', tags: ['Order'] },
    },
    '/dispatches': {
      get: { summary: 'List dispatches and tracking logs', tags: ['Dispatch'] },
      post: { summary: 'Record partial or full dispatch', tags: ['Dispatch'] },
    },
    '/billing': {
      get: { summary: 'List invoices and balances', tags: ['Billing'] },
      post: { summary: 'Generate or record invoice', tags: ['Billing'] },
    },
    '/purchases': {
      get: { summary: 'List procurement records', tags: ['Purchase'] },
      post: { summary: 'Record supplier purchase bill', tags: ['Purchase'] },
    },
    '/daily-summary': {
      get: { summary: 'Fetch date-wise billing, collection, purchase summary', tags: ['Daily Summary'] },
    },
    '/reports/dashboard': {
      get: { summary: 'Fetch real-time executive dashboard KPIs and monthly trends', tags: ['Reports'] },
    },
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Powertech ERP & CRM Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/daily-summary', dailySummaryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingRoutes);

// Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred.',
  });
});

export default app;
