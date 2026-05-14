"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.auditLogs = auditLogs;
const store_1 = require("../db/store");
const audit_service_1 = require("../services/audit.service");
function listUsers(req, res, next) {
    try {
        const users = store_1.db.listUsers();
        res.json({ users, total: users.length });
    }
    catch (err) {
        next(err);
    }
}
function auditLogs(req, res, next) {
    try {
        const page = parseInt(req.query.page ?? '1', 10);
        const limit = parseInt(req.query.limit ?? '50', 10);
        res.json((0, audit_service_1.getAuditLogs)(page, limit));
    }
    catch (err) {
        next(err);
    }
}
