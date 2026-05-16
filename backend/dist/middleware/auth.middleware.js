"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
const jwt_utils_1 = require("../utils/jwt.utils");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid Authorization header' });
        return;
    }
    try {
        req.user = (0, jwt_utils_1.verifyAccessToken)(header.slice(7));
        next();
    }
    catch {
        res.status(401).json({ message: 'Token expired or invalid' });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
}
