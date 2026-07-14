import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createSelfCheckoutSessionSchema, paymentIdParamSchema } from '../validators/payment.validators';
import { listMyPayments, createMyCheckoutSession, getMyPaymentReceipt } from '../controllers/paymentSelf.controller';

const router = Router();

router.use(authenticate, requireRole('renter'), scopeToOwner);

router.get('/', listMyPayments);
router.post('/checkout-session', validate(createSelfCheckoutSessionSchema), createMyCheckoutSession);
router.get('/:id/receipt', validate(paymentIdParamSchema), getMyPaymentReceipt);

export default router;
