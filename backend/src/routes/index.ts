import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import leaseRoutes from './lease.routes';
import tenantRoutes from './tenant.routes';
import tenantSelfRoutes from './tenantSelf.routes';
import ownerRoutes from './owner.routes';
import ownerSelfRoutes from './ownerSelf.routes';
import planRoutes from './plan.routes';
import subscriptionRoutes from './subscription.routes';
import paymentRoutes from './payment.routes';
import paymentSelfRoutes from './paymentSelf.routes';
import maintenanceRoutes from './maintenance.routes';
import maintenanceSelfRoutes from './maintenanceSelf.routes';
import staffRoutes from './staff.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/leases', leaseRoutes);
// Mounted before the owner/staff /tenants/:id routes so /tenants/me isn't captured as an :id param.
router.use('/tenants/me', tenantSelfRoutes);
router.use('/tenants', tenantRoutes);
// Mounted before the super_admin /owners/:id routes so /owners/me isn't captured as an :id param.
router.use('/owners/me', ownerSelfRoutes);
router.use('/owners', ownerRoutes);
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
// Mounted before the owner/staff /payments/:id routes so /payments/me isn't captured as an :id param.
router.use('/payments/me', paymentSelfRoutes);
router.use('/payments', paymentRoutes);
router.use('/maintenance-requests/me', maintenanceSelfRoutes);
router.use('/maintenance-requests', maintenanceRoutes);
router.use('/staff', staffRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
