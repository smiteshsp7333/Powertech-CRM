import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('ORDER', 'view'), getOrders);
router.get('/:id', requirePermission('ORDER', 'view'), getOrderById);
router.post('/', requirePermission('ORDER', 'create'), createOrder);
router.patch('/:id/status', requirePermission('ORDER', 'edit'), updateOrderStatus);
router.delete('/:id', requirePermission('ORDER', 'delete'), deleteOrder);

export default router;
