import { Router } from 'express';
import { getDashboardStats, getMyStats } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);
router.get('/my', authenticate, getMyStats);

export default router;
