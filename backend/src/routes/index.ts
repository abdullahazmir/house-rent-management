import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import leaseRoutes from './lease.routes';
import tenantRoutes from './tenant.routes';
import ownerRoutes from './owner.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/leases', leaseRoutes);
router.use('/tenants', tenantRoutes);
router.use('/owners', ownerRoutes);

export default router;
