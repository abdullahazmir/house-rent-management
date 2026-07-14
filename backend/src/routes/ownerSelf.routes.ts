import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { getMe, getConnectStatus, startConnectOnboarding, getConnectDashboardLink } from '../controllers/ownerSelf.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', getMe);
router.get('/connect/status', getConnectStatus);
router.post('/connect/onboard', startConnectOnboarding);
router.post('/connect/dashboard-link', getConnectDashboardLink);

export default router;
