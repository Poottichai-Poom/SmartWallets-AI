import { Router } from 'express';
import healthRoutes      from './health.routes';
import authRoutes        from './auth.routes';
import pdfRoutes         from './pdf.routes';
import transactionRoutes from './transaction.routes';
import analysisRoutes    from './analysis.routes';
import incomeRoutes      from './income.routes';
import goalRoutes        from './goal.routes';
import adminRoutes       from './admin.routes';

const router = Router();

router.use('/health',       healthRoutes);
router.use('/auth',         authRoutes);
router.use('/pdf',          pdfRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analysis',     analysisRoutes);
router.use('/income',       incomeRoutes);
router.use('/goals',        goalRoutes);
router.use('/admin',        adminRoutes);

export default router;
