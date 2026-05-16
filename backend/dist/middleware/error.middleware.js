"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const logger_1 = require("../utils/logger");
const errorMiddleware = (err, _req, res, _next) => {
    const status = err.status ?? 500;
    const message = err.message ?? 'Something went wrong';
    if (status >= 500)
        logger_1.logger.error(`[${status}] ${message}`, err);
    else
        logger_1.logger.warn(`[${status}] ${message}`);
    res.status(status).json({ status, message });
};
exports.errorMiddleware = errorMiddleware;
