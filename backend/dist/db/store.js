"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
function now() { return new Date().toISOString(); }
class Store {
    constructor() {
        this.filePath = path_1.default.resolve(process.env.DB_FILE ?? './data/db.json');
        this.data = this.load();
        this.migrateOutgoingTransfers();
    }
    load() {
        const empty = {
            users: [], refreshTokens: [], pdfStatements: [],
            pdfAccessSessions: [], transactions: [],
            incomeSources: [], goals: [], auditLogs: [], merchantMappings: [],
        };
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                return JSON.parse(fs_1.default.readFileSync(this.filePath, 'utf-8'));
            }
        }
        catch { /* start fresh */ }
        return empty;
    }
    migrateOutgoingTransfers() {
        const outgoingRe = /โอนเงินออก|transfer out|iorswt|morisw|morwsw|nmidsw/i;
        let changed = false;
        for (const t of this.data.transactions) {
            const text = `${t.merchant} ${t.note ?? ''}`;
            if (outgoingRe.test(text) && (t.type === 'income' || t.catId === 'income')) {
                t.catId = 'misc';
                t.type = 'wants';
                t.updatedAt = now();
                changed = true;
            }
        }
        if (changed)
            this.persist();
    }
    persist() {
        const dir = path_1.default.dirname(this.filePath);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }
    // ── Users ──────────────────────────────────────────────────────────────────
    findUserByEmail(email) {
        return this.data.users.find(u => u.email === email);
    }
    findUserById(id) {
        return this.data.users.find(u => u.id === id);
    }
    createUser(data) {
        const user = { ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now() };
        this.data.users.push(user);
        this.persist();
        return user;
    }
    listUsers() {
        return this.data.users.map(({ passwordHash: _, ...u }) => u);
    }
    // ── Refresh Tokens ─────────────────────────────────────────────────────────
    createRefreshToken(userId, token, expiresAt) {
        const rt = { id: (0, uuid_1.v4)(), token, userId, expiresAt, createdAt: now() };
        this.data.refreshTokens.push(rt);
        this.persist();
        return rt;
    }
    findRefreshToken(token) {
        return this.data.refreshTokens.find(rt => rt.token === token);
    }
    deleteRefreshToken(token) {
        this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.token !== token);
        this.persist();
    }
    deleteUserRefreshTokens(userId) {
        this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.userId !== userId);
        this.persist();
    }
    // ── PDF Statements ─────────────────────────────────────────────────────────
    createPDF(data) {
        const pdf = { ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now() };
        this.data.pdfStatements.push(pdf);
        this.persist();
        return pdf;
    }
    findPDFById(id) {
        return this.data.pdfStatements.find(p => p.id === id);
    }
    findPDFsByUser(userId) {
        return this.data.pdfStatements.filter(p => p.userId === userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    updatePDFStatus(id, status) {
        const pdf = this.data.pdfStatements.find(p => p.id === id);
        if (pdf) {
            pdf.status = status;
            pdf.updatedAt = now();
            this.persist();
        }
    }
    deletePDF(id) {
        this.data.pdfStatements = this.data.pdfStatements.filter(p => p.id !== id);
        this.persist();
    }
    // ── PDF Access Sessions ────────────────────────────────────────────────────
    createPDFSession(pdfId, token, expiresAt) {
        const session = { id: (0, uuid_1.v4)(), pdfId, token, expiresAt, createdAt: now() };
        this.data.pdfAccessSessions.push(session);
        this.persist();
        return session;
    }
    findPDFSession(token) {
        return this.data.pdfAccessSessions.find(s => s.token === token);
    }
    deletePDFSessions(pdfId) {
        this.data.pdfAccessSessions = this.data.pdfAccessSessions.filter(s => s.pdfId !== pdfId);
        this.persist();
    }
    deleteExpiredPDFSessions() {
        this.data.pdfAccessSessions = this.data.pdfAccessSessions.filter(s => new Date(s.expiresAt) > new Date());
        this.persist();
    }
    // ── Transactions ───────────────────────────────────────────────────────────
    createTransaction(data) {
        const txn = { ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now() };
        this.data.transactions.push(txn);
        this.persist();
        return txn;
    }
    createManyTransactions(items) {
        const txns = items.map(data => ({
            ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now(),
        }));
        this.data.transactions.push(...txns);
        this.persist();
        return txns;
    }
    findTransactionById(id) {
        return this.data.transactions.find(t => t.id === id);
    }
    findTransactionsByUser(userId, opts = {}) {
        let results = this.data.transactions.filter(t => {
            if (t.userId !== userId)
                return false;
            if (opts.month && !t.date.startsWith(opts.month))
                return false;
            if (opts.catId && t.catId !== opts.catId)
                return false;
            return true;
        }).sort((a, b) => b.date.localeCompare(a.date));
        const total = results.length;
        const page = opts.page ?? 1;
        const limit = opts.limit ?? 50;
        results = results.slice((page - 1) * limit, page * limit);
        return { items: results, total };
    }
    updateTransaction(id, userId, data) {
        const txn = this.data.transactions.find(t => t.id === id && t.userId === userId);
        if (!txn)
            return null;
        Object.assign(txn, data, { updatedAt: now() });
        this.persist();
        return txn;
    }
    deleteTransaction(id, userId) {
        const before = this.data.transactions.length;
        this.data.transactions = this.data.transactions.filter(t => !(t.id === id && t.userId === userId));
        const deleted = this.data.transactions.length < before;
        if (deleted)
            this.persist();
        return deleted;
    }
    deleteTransactionsByPdf(pdfId, userId) {
        const before = this.data.transactions.length;
        this.data.transactions = this.data.transactions.filter(t => !(t.pdfId === pdfId && t.userId === userId));
        const deletedCount = before - this.data.transactions.length;
        if (deletedCount > 0)
            this.persist();
        return deletedCount;
    }
    // ── Income Sources ─────────────────────────────────────────────────────────
    createIncomeSource(data) {
        const src = { ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now() };
        this.data.incomeSources.push(src);
        this.persist();
        return src;
    }
    findIncomeSources(userId) {
        return this.data.incomeSources.filter(s => s.userId === userId);
    }
    updateIncomeSource(id, userId, data) {
        const src = this.data.incomeSources.find(s => s.id === id && s.userId === userId);
        if (!src)
            return null;
        Object.assign(src, data, { updatedAt: now() });
        this.persist();
        return src;
    }
    deleteIncomeSource(id, userId) {
        const before = this.data.incomeSources.length;
        this.data.incomeSources = this.data.incomeSources.filter(s => !(s.id === id && s.userId === userId));
        const deleted = this.data.incomeSources.length < before;
        if (deleted)
            this.persist();
        return deleted;
    }
    // ── Goals ──────────────────────────────────────────────────────────────────
    createGoal(data) {
        const goal = { ...data, id: (0, uuid_1.v4)(), createdAt: now(), updatedAt: now() };
        this.data.goals.push(goal);
        this.persist();
        return goal;
    }
    findGoals(userId) {
        return this.data.goals.filter(g => g.userId === userId);
    }
    updateGoal(id, userId, data) {
        const goal = this.data.goals.find(g => g.id === id && g.userId === userId);
        if (!goal)
            return null;
        Object.assign(goal, data, { updatedAt: now() });
        this.persist();
        return goal;
    }
    deleteGoal(id, userId) {
        const before = this.data.goals.length;
        this.data.goals = this.data.goals.filter(g => !(g.id === id && g.userId === userId));
        const deleted = this.data.goals.length < before;
        if (deleted)
            this.persist();
        return deleted;
    }
    // ── Merchant Mappings ──────────────────────────────────────────────────────
    upsertMerchantMapping(userId, merchantKey, catId, type) {
        if (!this.data.merchantMappings)
            this.data.merchantMappings = [];
        const existing = this.data.merchantMappings.find(m => m.userId === userId && m.merchantKey === merchantKey);
        if (existing) {
            existing.catId = catId;
            existing.type = type;
            existing.updatedAt = now();
        }
        else {
            this.data.merchantMappings.push({ id: (0, uuid_1.v4)(), userId, merchantKey, catId, type, updatedAt: now() });
        }
        this.persist();
    }
    findMerchantMapping(userId, merchantKey) {
        if (!this.data.merchantMappings)
            return undefined;
        return this.data.merchantMappings.find(m => m.userId === userId && m.merchantKey === merchantKey);
    }
    // ── Audit Logs ─────────────────────────────────────────────────────────────
    createAuditLog(data) {
        const log = { ...data, id: (0, uuid_1.v4)(), createdAt: now() };
        this.data.auditLogs.push(log);
        if (this.data.auditLogs.length % 100 === 0)
            this.persist();
        return log;
    }
    findAuditLogs(page = 1, limit = 50) {
        const sorted = [...this.data.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return {
            logs: sorted.slice((page - 1) * limit, page * limit),
            total: sorted.length,
        };
    }
}
exports.db = new Store();
