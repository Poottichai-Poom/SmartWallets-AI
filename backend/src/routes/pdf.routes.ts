import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';
import { uploadPDF as multerPDF } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import * as ctrl from '../controllers/pdf.controller';

const router = Router();

router.use(authenticate);

router.get('/',                     ctrl.listPDFs);
router.post('/', uploadLimiter, multerPDF, validate(ctrl.uploadValidators), ctrl.uploadPDF);
router.post('/:id/verify',          validate(ctrl.verifyValidators), ctrl.verifyPassword);
router.get('/:id/file',             ctrl.getFile);
router.post('/:id/analyze',         ctrl.analyzePDF);
router.delete('/:id',               ctrl.deletePDF);

export default router;
