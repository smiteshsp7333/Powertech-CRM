import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/', requirePermission('SETTING', 'edit'), updateSettings);

export default router;
