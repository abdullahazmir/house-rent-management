import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { scopeToOwner } from '../middleware/scopeToOwner';
import { validate } from '../middleware/validate';
import { recordManualPaymentSchema, paymentIdParamSchema } from '../validators/payment.validators';
import { listPayments, getPayment, recordManualPayment, getPaymentReceipt } from '../controllers/payment.controller';

const router = Router();

router.use(authenticate, requireRole('owner', 'staff'), scopeToOwner);

router.get('/', listPayments);
router.post('/manual', validate(recordManualPaymentSchema), recordManualPayment);
router.get('/:id', validate(paymentIdParamSchema), getPayment);
router.get('/:id/receipt', validate(paymentIdParamSchema), getPaymentReceipt);

export default router;
