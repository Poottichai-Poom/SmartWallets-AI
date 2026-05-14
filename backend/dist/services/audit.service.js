"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
exports.getAuditLogs = getAuditLogs;
const store_1 = require("../db/store");
const logger_1 = require("../utils/logger");
function logAction(action, resource, options = {}) {
    try {
        store_1.db.createAuditLog({
            action,
            resource,
            userId: options.userId,
            details: options.details,
            ip: options.req?.ip,
            userAgent: options.req?.headers['user-agent'],
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to write audit log', { err });
    }
}
function getAuditLogs(page = 1, limit = 50) {
    return store_1.db.findAuditLogs(page, limit);
}
