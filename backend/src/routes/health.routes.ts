import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'SmartWallets-AI backend is running', ts: new Date().toISOString() });
});

export default router;
