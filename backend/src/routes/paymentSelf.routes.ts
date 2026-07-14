import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { createSelfCheckoutSessionSchema, paymentIdParamSchema } from '../validators/payment.validators';
import {
  listMyPayments,
  createMyCheckoutSession,
  getMyPaymentReceipt,
  simulateMyPayment,
} from '../controllers/paymentSelf.controller';

const router = Router();

router.use(authenticate, requireRole('renter'), scopeToOwner);

router.get('/', listMyPayments);
router.post('/checkout-session', validate(createSelfCheckoutSessionSchema), createMyCheckoutSession);
router.post('/:id/simulate', validate(paymentIdParamSchema), simulateMyPayment);
router.get('/:id/receipt', validate(paymentIdParamSchema), getMyPaymentReceipt);

export default router;
