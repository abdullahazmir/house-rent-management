import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import leaseRoutes from './lease.routes';
import tenantRoutes from './tenant.routes';
import ownerRoutes from './owner.routes';
import ownerSelfRoutes from './ownerSelf.routes';
import planRoutes from './plan.routes';
import subscriptionRoutes from './subscription.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/leases', leaseRoutes);
router.use('/tenants', tenantRoutes);
// Mounted before the super_admin /owners/:id routes so /owners/me isn't captured as an :id param.
router.use('/owners/me', ownerSelfRoutes);
router.use('/owners', ownerRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);

export default router;
