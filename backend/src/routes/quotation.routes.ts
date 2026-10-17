import { Router } from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  createRevisionOrUpdate,
  convertToOrder,
  downloadQuotationPdf,
  deleteQuotation,
} from '../controllers/quotation.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('QUOTATION', 'view'), getQuotations);
router.get('/:id', requirePermission('QUOTATION', 'view'), getQuotationById);
router.get('/:id/pdf', requirePermission('QUOTATION', 'export'), downloadQuotationPdf);
router.post('/', requirePermission('QUOTATION', 'create'), createQuotation);
router.put('/:id', requirePermission('QUOTATION', 'edit'), createRevisionOrUpdate);
router.post('/:id/convert-to-order', requirePermission('ORDER', 'create'), convertToOrder);
router.delete('/:id', requirePermission('QUOTATION', 'delete'), deleteQuotation);

export default router;
