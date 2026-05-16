"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'SmartWallets-AI backend is running', ts: new Date().toISOString() });
});
exports.default = router;
