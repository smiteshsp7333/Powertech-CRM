import { Router } from 'express';
import {
  getInvoices,
  getPendingPayments,
  createInvoice,
  recordPayment,
  addCreditNote,
  downloadInvoicePdf,
} from '../controllers/billing.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('BILLING', 'view'), getInvoices);
router.get('/pending-payments', requirePermission('BILLING', 'view'), getPendingPayments);
router.get('/:id/pdf', requirePermission('BILLING', 'export'), downloadInvoicePdf);
router.post('/', requirePermission('BILLING', 'create'), createInvoice);
router.post('/:invoiceId/payments', requirePermission('BILLING', 'create'), recordPayment);
router.post('/:invoiceId/credit-note', requirePermission('BILLING', 'edit'), addCreditNote);

export default router;
