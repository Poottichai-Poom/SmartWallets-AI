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
exports.updateValidators = exports.createValidators = void 0;
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const express_validator_1 = require("express-validator");
const txnService = __importStar(require("../services/transaction.service"));
exports.createValidators = [
    (0, express_validator_1.body)('date').isISO8601().withMessage('date must be ISO 8601'),
    (0, express_validator_1.body)('merchant').trim().notEmpty(),
    (0, express_validator_1.body)('amount').isFloat({ gt: 0 }).withMessage('amount must be positive'),
    (0, express_validator_1.body)('catId').optional().isString(),
    (0, express_validator_1.body)('note').optional().trim(),
];
exports.updateValidators = [
    (0, express_validator_1.body)('date').optional().isISO8601(),
    (0, express_validator_1.body)('merchant').optional().trim().notEmpty(),
    (0, express_validator_1.body)('amount').optional().isFloat({ gt: 0 }),
    (0, express_validator_1.body)('catId').optional().isString(),
    (0, express_validator_1.body)('note').optional().trim(),
];
function list(req, res, next) {
    try {
        const month = req.query.month;
        const catId = req.query.catId;
        const page = parseInt(req.query.page ?? '1', 10);
        const limit = parseInt(req.query.limit ?? '50', 10);
        const result = txnService.getTransactions(req.user.id, { month, catId, page, limit });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const txn = txnService.createTransaction(req.user.id, req.body);
        res.status(201).json(txn);
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const txn = txnService.updateTransaction(req.params.id, req.user.id, req.body);
        res.json(txn);
    }
    catch (err) {
        next(err);
    }
}
function remove(req, res, next) {
    try {
        txnService.deleteTransaction(req.params.id, req.user.id);
        res.json({ message: 'Transaction deleted' });
    }
    catch (err) {
        next(err);
    }
}
