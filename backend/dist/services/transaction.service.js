"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
exports.importExtractedTransactions = importExtractedTransactions;
const store_1 = require("../db/store");
const ai_service_1 = require("./ai.service");
function merchantKey(note, merchant) {
    if (note) {
        // Capture method code e.g. (IORSWT) and account/bill code e.g. 014-4300868673
        const m = note.match(/\((\w+)\)\s+(\S+)/);
        if (m)
            return `${m[1]}:${m[2].replace(/~+$/, '')}`.toLowerCase();
    }
    return merchant.toLowerCase().trim();
}
function getTransactions(userId, opts = {}) {
    return store_1.db.findTransactionsByUser(userId, opts);
}
function createTransaction(userId, data) {
    const { catId, type } = data.catId
        ? { catId: data.catId, type: data.type ?? 'wants' }
        : (0, ai_service_1.categorize)(data.merchant, data.note);
    return store_1.db.createTransaction({
        userId,
        date: data.date,
        merchant: data.merchant,
        amount: data.amount,
        catId,
        type: type,
        note: data.note,
        manual: true,
    });
}
function updateTransaction(id, userId, data) {
    const updated = store_1.db.updateTransaction(id, userId, data);
    if (!updated)
        throw Object.assign(new Error('Transaction not found'), { status: 404 });
    if (data.catId && data.type) {
        const key = merchantKey(updated.note, updated.merchant);
        store_1.db.upsertMerchantMapping(userId, key, data.catId, data.type);
        // Sync all other transactions with the same merchant key
        const { items: all } = store_1.db.findTransactionsByUser(userId, { limit: 9999 });
        for (const t of all) {
            if (t.id !== id && merchantKey(t.note, t.merchant) === key) {
                store_1.db.updateTransaction(t.id, userId, { catId: data.catId, type: data.type });
            }
        }
    }
    return updated;
}
function deleteTransaction(id, userId) {
    const deleted = store_1.db.deleteTransaction(id, userId);
    if (!deleted)
        throw Object.assign(new Error('Transaction not found'), { status: 404 });
}
function importExtractedTransactions(userId, pdfId, extracted) {
    // 1. Get existing transactions for this user for the months covered by 'extracted'
    const months = [...new Set(extracted
            .filter(t => typeof t.date === 'string' && t.date.length >= 7)
            .map(t => t.date.slice(0, 7)))];
    const existing = months.flatMap(m => store_1.db.findTransactionsByUser(userId, { month: m, limit: 9999 }).items);
    const toImport = [];
    for (const t of extracted) {
        // Basic validation
        if (!t.date || !t.merchant || typeof t.amount !== 'number' || isNaN(t.amount))
            continue;
        if (t.amount <= 0)
            continue;
        // Deduplication: check against DB and current batch
        const isDupInDB = existing.some(e => e.date === t.date &&
            Math.abs(e.amount - t.amount) < 0.01 &&
            e.merchant.toLowerCase().trim() === t.merchant.toLowerCase().trim());
        const isDupInBatch = toImport.some(i => i.date === t.date &&
            Math.abs(i.amount - t.amount) < 0.01 &&
            i.merchant.toLowerCase().trim() === t.merchant.toLowerCase().trim());
        if (!isDupInDB && !isDupInBatch) {
            const key = merchantKey(t.note, t.merchant);
            const saved = store_1.db.findMerchantMapping(userId, key);
            const { catId, type } = saved
                ? { catId: saved.catId, type: saved.type }
                : (0, ai_service_1.categorize)(t.merchant, t.note, t.type);
            toImport.push({
                userId,
                pdfId,
                date: t.date,
                merchant: t.merchant,
                amount: t.amount,
                balance: t.balance,
                catId,
                type,
                note: t.note,
                manual: false
            });
        }
    }
    if (toImport.length === 0)
        return [];
    return store_1.db.createManyTransactions(toImport);
}
