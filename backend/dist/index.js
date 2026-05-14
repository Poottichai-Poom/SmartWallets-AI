"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const logger_1 = require("./utils/logger");
const pdf_service_1 = require("./services/pdf.service");
const app = (0, express_1.default)();
const port = process.env.PORT ?? 3002;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(rateLimit_middleware_1.apiLimiter);
app.use('/api', routes_1.default);
app.use(error_middleware_1.errorMiddleware);
// Clean expired PDF sessions every 15 minutes
setInterval(pdf_service_1.cleanExpiredSessions, 15 * 60 * 1000);
app.listen(port, () => {
    logger_1.logger.info(`SmartWallets-AI backend running on port ${port}`);
});
