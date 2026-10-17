import { Router } from 'express';
import {
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from '../controllers/enquiry.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('ENQUIRY', 'view'), getEnquiries);
router.get('/:id', requirePermission('ENQUIRY', 'view'), getEnquiryById);
router.post('/', requirePermission('ENQUIRY', 'create'), createEnquiry);
router.put('/:id', requirePermission('ENQUIRY', 'edit'), updateEnquiry);
router.delete('/:id', requirePermission('ENQUIRY', 'delete'), deleteEnquiry);

export default router;
