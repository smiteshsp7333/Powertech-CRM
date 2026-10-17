import { Router } from 'express';
import { login, refresh, getMe, changePassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, changePassword);

export default router;
