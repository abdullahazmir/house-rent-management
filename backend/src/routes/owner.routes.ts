import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { ownerIdParamSchema } from '../validators/owner.validators';
import { listOwners, getOwner, suspendOwner, activateOwner } from '../controllers/owner.controller';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/', listOwners);
router.get('/:id', validate(ownerIdParamSchema), getOwner);
router.patch('/:id/suspend', validate(ownerIdParamSchema), suspendOwner);
router.patch('/:id/activate', validate(ownerIdParamSchema), activateOwner);

export default router;
