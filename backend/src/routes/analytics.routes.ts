import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { getOwnerAnalytics, getAdminAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/owner', authenticate, requireRole('owner', 'staff'), scopeToOwner, getOwnerAnalytics);
router.get('/admin', authenticate, requireRole('super_admin'), getAdminAnalytics);

export default router;
