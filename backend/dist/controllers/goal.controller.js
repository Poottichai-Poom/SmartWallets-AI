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
    (0, express_validator_1.body)('target').isFloat({ gt: 0 }),
    (0, express_validator_1.body)('saved').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('byMonths').isInt({ min: 1 }),
    (0, express_validator_1.body)('priority').isIn(['low', 'medium', 'high']),
];
exports.updateValidators = [
    (0, express_validator_1.body)('nameEn').optional().trim().notEmpty(),
    (0, express_validator_1.body)('target').optional().isFloat({ gt: 0 }),
    (0, express_validator_1.body)('saved').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('byMonths').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high']),
];
function list(req, res, next) {
    try {
        res.json({ goals: store_1.db.findGoals(req.user.id) });
    }
    catch (err) {
        next(err);
    }
}
function create(req, res, next) {
    try {
        const goal = store_1.db.createGoal({ ...req.body, userId: req.user.id, saved: req.body.saved ?? 0 });
        res.status(201).json(goal);
    }
    catch (err) {
        next(err);
    }
}
function update(req, res, next) {
    try {
        const goal = store_1.db.updateGoal(req.params.id, req.user.id, req.body);
        if (!goal) {
            res.status(404).json({ message: 'Goal not found' });
            return;
        }
        res.json(goal);
    }
    catch (err) {
        next(err);
    }
}
function remove(req, res, next) {
    try {
        const deleted = store_1.db.deleteGoal(req.params.id, req.user.id);
        if (!deleted) {
            res.status(404).json({ message: 'Goal not found' });
            return;
        }
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        next(err);
    }
}
