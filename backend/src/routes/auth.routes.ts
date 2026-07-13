import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { registerSchema, loginSchema } from '../validators/auth.validators';
import { acceptInviteSchema } from '../validators/tenant.validators';
import { register, login, refresh, logout, me, acceptInvite } from '../controllers/auth.controller';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/accept-invite', authRateLimit, validate(acceptInviteSchema), acceptInvite);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
