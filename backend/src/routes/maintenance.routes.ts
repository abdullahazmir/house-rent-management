import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { updateMaintenanceRequestSchema } from '../validators/maintenance.validators';
import { listMaintenanceRequests, updateMaintenanceRequest } from '../controllers/maintenance.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', listMaintenanceRequests);
router.patch('/:id', validate(updateMaintenanceRequestSchema), updateMaintenanceRequest);

export default router;
