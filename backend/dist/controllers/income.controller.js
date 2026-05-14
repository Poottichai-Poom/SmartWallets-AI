"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateValidators = exports.createValidators = void 0;
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const express_validator_1 = require("express-validator");
const store_1 = require("../db/store");
exports.createValidators = [
    (0, express_validator_1.body)('nameEn').trim().notEmpty(),
    (0, express_validator_1.body)('nameTh').optional().trim(),
    (0, express_validator_1.body)('amount').isFloat({ gt: 0 }),
    (0, express_validator_1.body)('type').isIn(['salary', 'side', 'investment', 'bonus', 'other']),
    (0, express_validator_1.body)('dayOfMonth').isInt({ min: 1, max: 31 }),
];
exports.updateValidators = [
    (0, express_validator_1.body)('nameEn').optional().trim().notEmpty(),
    (0, express_validator_1.body)('amount').optional().isFloat({ gt: 0 }),
    (0, express_validator_1.body)('type').optional().isIn(['salary', 'side', 'investment', 'bonus', 'other']),
    (0, express_validator_1.body)('dayOfMonth').optional().isInt({ min: 1, max: 31 }),
];
function list(req, res, next) {
    try {
        res.json({ incomeSources: store_1.db.findIncomeSources(req.user.id) });
    }
    catch (err) {
        next(err);
    }
}
function create(req, res, next) {
    try {
        const src = store_1.db.createIncomeSource({ ...req.body, userId: req.user.id });
        res.status(201).json(src);
    }
    catch (err) {
        next(err);
    }
}
function update(req, res, next) {
    try {
        const src = store_1.db.updateIncomeSource(req.params.id, req.user.id, req.body);
        if (!src) {
            res.status(404).json({ message: 'Income source not found' });
            return;
        }
        res.json(src);
    }
    catch (err) {
        next(err);
    }
}
function remove(req, res, next) {
    try {
        const deleted = store_1.db.deleteIncomeSource(req.params.id, req.user.id);
        if (!deleted) {
            res.status(404).json({ message: 'Income source not found' });
            return;
        }
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        next(err);
    }
}
