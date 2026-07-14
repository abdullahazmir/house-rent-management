import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription';
import { enforcePlanLimits } from '../middleware/enforcePlanLimits';
import {
  createUnitSchema,
  updateUnitSchema,
  unitIdParamSchema,
  listUnitsParamSchema,
} from '../validators/unit.validators';
import { listUnits, createUnit, getUnit, updateUnit, deleteUnit } from '../controllers/unit.controller';

// mergeParams so this router (mounted at /properties/:propertyId/units) can read propertyId.
const router = Router({ mergeParams: true });

router.get('/', validate(listUnitsParamSchema), listUnits);
router.post('/', requireActiveSubscription, enforcePlanLimits('units'), validate(createUnitSchema), createUnit);
router.get('/:id', validate(unitIdParamSchema), getUnit);
router.patch('/:id', validate(updateUnitSchema), updateUnit);
router.delete('/:id', validate(unitIdParamSchema), deleteUnit);

export default router;
