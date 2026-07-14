import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { enforcePlanLimits } from '../middleware/enforcePlanLimits';
import { validate } from '../middleware/validate';
import { createStaffSchema, staffIdParamSchema } from '../validators/staff.validators';
import { listStaff, createStaff, deactivateStaff, activateStaff } from '../controllers/staff.controller';

const router = Router();

router.use(authenticate, scopeToOwner);

router.get('/', requireRole('owner', 'staff'), listStaff);
// Only the owner (not staff) manages staff accounts.
router.post('/', requireRole('owner'), enforcePlanLimits('staff'), validate(createStaffSchema), createStaff);
router.patch('/:id/deactivate', requireRole('owner'), validate(staffIdParamSchema), deactivateStaff);
router.patch('/:id/activate', requireRole('owner'), validate(staffIdParamSchema), activateStaff);

export default router;
