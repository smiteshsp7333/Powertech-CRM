import { Router } from 'express';
import {
  getRoles,
  getRoleById,
  updateRolePermissions,
} from '../controllers/role.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('USER_ROLE', 'view'), getRoles);
router.get('/:id', requirePermission('USER_ROLE', 'view'), getRoleById);
router.put('/:id', requirePermission('USER_ROLE', 'edit'), updateRolePermissions);

export default router;
