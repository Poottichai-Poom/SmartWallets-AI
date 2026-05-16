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
exports.summary = summary;
exports.categories = categories;
exports.daily = daily;
exports.leaks = leaks;
exports.recommendations = recommendations;
exports.recommendedAllocation = recommendedAllocation;
const analysisService = __importStar(require("../services/analysis.service"));
const aiService = __importStar(require("../services/ai.service"));
const store_1 = require("../db/store");
function currentMonth() {
    return new Date().toISOString().slice(0, 7);
}
function summary(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const data = analysisService.getMonthlySummary(req.user.id, month);
        res.json(data);
    }
    catch (err) {
        next(err);
    }
}
function categories(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const { categories } = analysisService.getMonthlySummary(req.user.id, month);
        res.json({ categories });
    }
    catch (err) {
        next(err);
    }
}
function daily(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const daily = analysisService.getDailySpending(req.user.id, month);
        res.json({ month, daily });
    }
    catch (err) {
        next(err);
    }
}
function leaks(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const data = analysisService.getSpendingLeaks(req.user.id, month);
        res.json({ leaks: data });
    }
    catch (err) {
        next(err);
    }
}
async function recommendations(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const { items: transactions } = store_1.db.findTransactionsByUser(req.user.id, { month, limit: 9999 });
        const analysis = await aiService.generateSpendingAnalysis(transactions);
        res.json({ analysis });
    }
    catch (err) {
        next(err);
    }
}
async function recommendedAllocation(req, res, next) {
    try {
        const month = req.query.month ?? currentMonth();
        const { items: transactions } = store_1.db.findTransactionsByUser(req.user.id, { month, limit: 9999 });
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const allocations = await aiService.generateRecommendedAllocation(transactions, totalIncome);
        res.json({ allocations, totalIncome });
    }
    catch (err) {
        next(err);
    }
}
