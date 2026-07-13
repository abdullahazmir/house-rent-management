import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { inviteTenantSchema, updateTenantSchema, tenantIdParamSchema } from '../validators/tenant.validators';
import { listTenants, inviteTenant, getTenant, updateTenant } from '../controllers/tenant.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', listTenants);
router.post('/', validate(inviteTenantSchema), inviteTenant);
router.get('/:id', validate(tenantIdParamSchema), getTenant);
router.patch('/:id', validate(updateTenantSchema), updateTenant);

export default router;
