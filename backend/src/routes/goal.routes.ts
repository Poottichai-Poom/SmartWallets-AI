import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as ctrl from '../controllers/goal.controller';

const router = Router();

router.use(authenticate);

router.get('/',      ctrl.list);
router.post('/',     validate(ctrl.createValidators), ctrl.create);
router.put('/:id',   validate(ctrl.updateValidators), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
