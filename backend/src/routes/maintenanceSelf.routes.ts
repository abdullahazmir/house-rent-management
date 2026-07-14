import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createMaintenanceRequestSchema } from '../validators/maintenance.validators';
import { listMyMaintenanceRequests, createMyMaintenanceRequest } from '../controllers/maintenanceSelf.controller';

const router = Router();

router.use(authenticate, requireRole('renter'), scopeToOwner);

router.get('/', listMyMaintenanceRequests);
router.post('/', validate(createMaintenanceRequestSchema), createMyMaintenanceRequest);

export default router;
