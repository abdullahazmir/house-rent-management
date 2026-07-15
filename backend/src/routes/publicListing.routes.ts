import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { listPublicUnitsSchema, publicUnitIdParamSchema } from '../validators/publicListing.validators';
import { listPublicUnits, getPublicUnit, rentPublicUnit } from '../controllers/publicListing.controller';

const router = Router();

// GET routes are intentionally public (no authenticate/scopeToOwner) — prospective renters
// browse across all owners' listings. See publicListing.controller.ts for why that's safe.
router.get('/', validate(listPublicUnitsSchema), listPublicUnits);
router.get('/:id', validate(publicUnitIdParamSchema), getPublicUnit);
router.post('/:id/rent', authenticate, requireRole('renter'), validate(publicUnitIdParamSchema), rentPublicUnit);

export default router;
