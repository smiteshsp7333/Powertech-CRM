import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplier.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('PURCHASE', 'view'), getSuppliers);
router.post('/', requirePermission('PURCHASE', 'create'), createSupplier);

export default router;
