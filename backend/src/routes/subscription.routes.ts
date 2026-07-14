import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createCheckoutSessionSchema } from '../validators/subscription.validators';
import { getSubscription, createCheckoutSession, createPortalSession } from '../controllers/subscription.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', getSubscription);
router.post('/checkout-session', validate(createCheckoutSessionSchema), createCheckoutSession);
router.post('/portal-session', createPortalSession);

export default router;
