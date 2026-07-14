import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { createPlanSchema, updatePlanSchema } from '../validators/plan.validators';
import { listPublicPlans, listAllPlans, createPlan, updatePlan } from '../controllers/plan.controller';

const router = Router();

router.get('/', listPublicPlans);
router.get('/all', authenticate, requireRole('super_admin'), listAllPlans);
router.post('/', authenticate, requireRole('super_admin'), validate(createPlanSchema), createPlan);
router.patch('/:id', authenticate, requireRole('super_admin'), validate(updatePlanSchema), updatePlan);

export default router;
