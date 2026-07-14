import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { getMyProfile, getMyLease } from '../controllers/tenantSelf.controller';

const router = Router();

router.use(authenticate, requireRole('renter'), scopeToOwner);

router.get('/', getMyProfile);
router.get('/lease', getMyLease);

export default router;
