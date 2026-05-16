import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(ctrl.registerValidators), ctrl.register);
router.post('/login',    authLimiter, validate(ctrl.loginValidators),    ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);
router.get('/me',        authenticate, ctrl.me);

export default router;
