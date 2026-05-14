import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users',      ctrl.listUsers);
router.get('/audit-logs', ctrl.auditLogs);

export default router;
