import { Router } from 'express';
import {
  getDailySummary,
  addAdjustment,
  toggleDayLock,
} from '../controllers/dailySummary.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('DAILY_SUMMARY', 'view'), getDailySummary);
router.post('/adjustments', requirePermission('DAILY_SUMMARY', 'create'), addAdjustment);
router.post('/lock', requirePermission('DAILY_SUMMARY', 'edit'), toggleDayLock);

export default router;
