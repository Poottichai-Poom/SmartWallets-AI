"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidators = exports.registerValidators = void 0;
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const express_validator_1 = require("express-validator");
const authService = __importStar(require("../services/auth.service"));
const audit_service_1 = require("../services/audit.service");
exports.registerValidators = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('name').optional().trim().isLength({ max: 100 }),
];
exports.loginValidators = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty(),
];
async function register(req, res, next) {
    try {
        const { email, password, name } = req.body;
        const user = await authService.register(email, password, name);
        (0, audit_service_1.logAction)('USER_REGISTERED', `user:${user.id}`, { userId: user.id, req });
        res.status(201).json({ message: 'Account created', user });
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        (0, audit_service_1.logAction)('USER_LOGIN', `user:${result.user.id}`, { userId: result.user.id, req });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ message: 'refreshToken required' });
            return;
        }
        const tokens = await authService.refreshTokens(refreshToken);
        res.json(tokens);
    }
    catch (err) {
        next(err);
    }
}
async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken)
            authService.logout(refreshToken);
        const authReq = req;
        if (authReq.user)
            (0, audit_service_1.logAction)('USER_LOGOUT', `user:${authReq.user.id}`, { userId: authReq.user.id, req });
        res.json({ message: 'Logged out' });
    }
    catch (err) {
        next(err);
    }
}
function me(req, res, next) {
    try {
        const user = authService.getUserById(req.user.id);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
}
