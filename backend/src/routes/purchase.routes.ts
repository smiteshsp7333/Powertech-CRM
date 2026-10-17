import { Router } from 'express';
import {
  getPurchases,
  createPurchase,
  deletePurchase,
} from '../controllers/purchase.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('PURCHASE', 'view'), getPurchases);
router.post('/', requirePermission('PURCHASE', 'create'), createPurchase);
router.delete('/:id', requirePermission('PURCHASE', 'delete'), deletePurchase);

export default router;
