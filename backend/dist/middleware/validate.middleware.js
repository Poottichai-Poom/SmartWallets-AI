"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
function validate(chains) {
    return async (req, res, next) => {
        await Promise.all(chains.map(chain => chain.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ message: 'Validation failed', errors: errors.array() });
            return;
        }
        next();
    };
}
