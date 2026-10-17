import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.post('/', createCustomer);

export default router;
