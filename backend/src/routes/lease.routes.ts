import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createLeaseSchema, updateLeaseSchema, leaseIdParamSchema } from '../validators/lease.validators';
import { listLeases, createLease, getLease, updateLease, terminateLease } from '../controllers/lease.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', listLeases);
router.post('/', validate(createLeaseSchema), createLease);
router.get('/:id', validate(leaseIdParamSchema), getLease);
router.patch('/:id', validate(updateLeaseSchema), updateLease);
router.post('/:id/terminate', validate(leaseIdParamSchema), terminateLease);

export default router;
