import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createPropertySchema, updatePropertySchema, propertyIdParamSchema } from '../validators/property.validators';
import {
  listProperties,
  createProperty,
  getProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/property.controller';
import unitRoutes from './unit.routes';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', listProperties);
router.post('/', validate(createPropertySchema), createProperty);
router.get('/:id', validate(propertyIdParamSchema), getProperty);
router.patch('/:id', validate(updatePropertySchema), updateProperty);
router.delete('/:id', validate(propertyIdParamSchema), deleteProperty);

router.use('/:propertyId/units', unitRoutes);

export default router;
