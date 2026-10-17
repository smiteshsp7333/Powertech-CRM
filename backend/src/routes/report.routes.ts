import { Router } from 'express';
import { getDashboardMetrics, getReportData } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardMetrics);
router.get('/data', requirePermission('REPORT', 'view'), getReportData);

export default router;
