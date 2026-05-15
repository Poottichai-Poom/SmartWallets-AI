import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/analysis.controller';

const router = Router();

router.use(authenticate);

router.get('/summary',         ctrl.summary);
router.get('/categories',      ctrl.categories);
router.get('/daily',           ctrl.daily);
router.get('/leaks',           ctrl.leaks);
router.get('/recommendations',         ctrl.recommendations);
router.get('/recommended-allocation',  ctrl.recommendedAllocation);

export default router;
