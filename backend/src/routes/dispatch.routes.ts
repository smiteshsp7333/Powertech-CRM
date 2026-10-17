import { Router } from 'express';
import {
  getDispatches,
  createDispatch,
  updateDeliveryStatus,
  uploadCompletionPhotos,
  deleteCompletionPhoto,
} from '../controllers/dispatch.controller';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { uploadMiddleware } from '../services/storage.service';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('DISPATCH', 'view'), getDispatches);
router.post('/', requirePermission('DISPATCH', 'create'), createDispatch);
router.patch('/:id/status', requirePermission('DISPATCH', 'edit'), updateDeliveryStatus);
router.post(
  '/orders/:orderId/photos',
  requirePermission('DISPATCH', 'create'),
  uploadMiddleware.array('photos', 10),
  uploadCompletionPhotos
);
router.delete('/photos/:photoId', requirePermission('DISPATCH', 'delete'), deleteCompletionPhoto);

export default router;
