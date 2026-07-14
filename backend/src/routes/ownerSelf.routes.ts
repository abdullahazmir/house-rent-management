import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { getMe, getConnectStatus, startConnectOnboarding, getConnectDashboardLink } from '../controllers/ownerSelf.controller';

const router = Router();

router.use(authenticate, scopeToOwner);

router.get('/', requireRole('owner', 'staff'), getMe);
router.get('/connect/status', requireRole('owner', 'staff'), getConnectStatus);
// Connect payout setup touches banking details — owner only, not staff.
router.post('/connect/onboard', requireRole('owner'), startConnectOnboarding);
router.post('/connect/dashboard-link', requireRole('owner'), getConnectDashboardLink);

export default router;
