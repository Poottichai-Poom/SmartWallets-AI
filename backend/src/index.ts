import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { logger } from './utils/logger';
import { cleanExpiredSessions } from './services/pdf.service';

const app = express();
const port = process.env.PORT ?? 3002;

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

app.use('/api', routes);
app.use(errorMiddleware);

// Clean expired PDF sessions every 15 minutes
setInterval(cleanExpiredSessions, 15 * 60 * 1000);

app.listen(port, () => {
  logger.info(`SmartWallets-AI backend running on port ${port}`);
});
