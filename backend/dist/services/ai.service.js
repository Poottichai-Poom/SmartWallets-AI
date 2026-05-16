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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryList = getCategoryList;
exports.categorize = categorize;
exports.extractTransactionsFromPDF = extractTransactionsFromPDF;
exports.generateRecommendedAllocation = generateRecommendedAllocation;
exports.generateSpendingAnalysis = generateSpendingAnalysis;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
const pdfjs = __importStar(require("pdfjs-dist/legacy/build/pdf.mjs"));
const logger_1 = require("../utils/logger");
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma3';
async function ollamaJSON(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
        const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_MODEL, prompt, format: 'json', stream: false, options: { num_ctx: 8192 } }),
            signal: controller.signal,
        });
        if (!res.ok)
            throw new Error(`Ollama ${res.status}: ${await res.text()}`);
        const data = await res.json();
        return JSON.parse(data.response);
    }
    finally {
        clearTimeout(timeout);
    }
}
const CATEGORIES = {
    rent: { en: 'Housing', th: 'ที่อยู่อาศัย', type: 'needs', keywords: ['rent', 'property', 'apartment', 'condo', 'house', 'housing'] },
    food: { en: 'Groceries', th: 'อาหาร', type: 'needs', keywords: ['tesco', 'lotuss', 'foodland', 'big c', 'tops', 'villa market', '7-eleven', 'cpall', 'family mart', 'makro', 'cj express'] },
    commute: { en: 'Transport', th: 'การเดินทาง', type: 'needs', keywords: ['bts', 'mrt', 'grab*ride', 'bolt', 'ptt', 'shell', 'bangchak', 'taxi', 'rabbit', 'skytrain'] },
    utility: { en: 'Utilities', th: 'สาธารณูปโภค', type: 'needs', keywords: ['pea', 'mea', 'ais', 'true internet', 'dtac', '3bb', 'ais-postpaid', 'electric', 'water'] },
    health: { en: 'Health', th: 'สุขภาพ', type: 'needs', keywords: ['bumrungrad', 'watsons', 'boots', 'pharmacy', 'hospital', 'clinic', 'medical'] },
    dining: { en: 'Dining out', th: 'ร้านอาหาร', type: 'wants', keywords: ['grab food', 'grabfood', 'lineman', 'foodpanda', 'after you', 'cafe amazon', 'starbucks', 'sukishi', 'bonchon', 'kfc', 'mk restaurant', 'yayoi', 'mcdonald', 'burger', 'pizza'] },
    shopping: { en: 'Shopping', th: 'ช้อปปิ้ง', type: 'wants', keywords: ['shopee', 'lazada', 'ikea', 'uniqlo', 'zara', 'h&m', 'central', 'robinson', 'daiso'] },
    fun: { en: 'Entertainment', th: 'บันเทิง', type: 'wants', keywords: ['major', 'sf cinema', 'steam', 'nintendo', 'playstation', 'concert', 'asiatique', 'cinema'] },
    subs: { en: 'Subscriptions', th: 'สมัครสมาชิก', type: 'wants', keywords: ['netflix', 'disney+', 'spotify', 'youtube premium', 'apple tv', 'icloud', 'adobe', 'notion', 'canva'] },
    misc: { en: 'Misc', th: 'อื่นๆ', type: 'wants', keywords: ['atm fee', 'bank charge', 'fee', 'charge', 'misc', 'gift'] },
    income: { en: 'Income', th: 'รายได้', type: 'income', keywords: ['deposit', 'เงินเข้า', 'เงินโอนเข้า', 'salary', 'เงินเดือน', 'dividend', 'interest', 'กยศ', 'กองทุนให้กู้ยืม', 'education loan'] },
};
function getCategoryList() {
    return Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));
}
function categorize(merchant, note, type) {
    const text = `${merchant} ${note ?? ''}`.toLowerCase();
    // Outgoing transfers are never income regardless of AI-extracted type
    const outgoingRe = /โอนเงินออก|transfer out|iorswt|morisw|morwsw|nmidsw/;
    if (outgoingRe.test(text))
        return { catId: 'misc', type: 'wants' };
    if (type === 'credit')
        return { catId: 'income', type: 'income' };
    for (const [id, cat] of Object.entries(CATEGORIES)) {
        if (cat.keywords.some(kw => text.includes(kw))) {
            return { catId: id, type: cat.type };
        }
    }
    return { catId: 'misc', type: 'wants' };
}
async function extractTransactionsFromPDF(buffer, bankPassword) {
    const logFile = path_1.default.resolve(__dirname, '../../extraction.log');
    const log = (msg) => fs_1.default.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    let text = '';
    try {
        log(`Extracting PDF with bankPassword: ${bankPassword ? 'YES' : 'NO'}`);
        const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            password: bankPassword,
            useSystemFonts: true,
            disableFontFace: true,
            isEvalSupported: false,
        });
        const pdf = await loadingTask.promise;
        log(`PDF loaded successfully, pages: ${pdf.numPages}`);
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const items = content.items;
            let lastY = -1;
            let pageText = '';
            for (const item of items) {
                if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            }
            fullText += pageText + '\n\n';
        }
        text = fullText;
        log(`Text extraction complete, length: ${text.length}`);
        fs_1.default.writeFileSync(path_1.default.resolve(__dirname, '../../pdf_text_debug.txt'), text, 'utf8');
    }
    catch (err) {
        log(`PDF extraction error: ${err.message || err.name || JSON.stringify(err)}`);
        console.error('PDF extraction error details:', err);
        logger_1.logger.warn('PDF extraction failed — wrong bank password or unsupported format', { err });
        throw new Error('ไม่สามารถอ่าน PDF ได้ — ตรวจสอบรหัสผ่าน PDF จากธนาคาร');
    }
    const CHUNK = 3000;
    const allExtracted = [];
    for (let offset = 0; offset < text.length; offset += CHUNK) {
        const chunk = text.slice(offset, offset + CHUNK);
        try {
            const prompt = `Extract transactions from Thai bank statement chunk. Return JSON: {"transactions":[{date:"DD/MM/YY as-is from text",merchant:"name",amount:number,type:"debit"|"credit",balance:number,note:"raw"},...]}
Rules: amount positive; credit=deposits/เงินเข้า/โอนเข้า/กยศ/CR, debit=withdrawals/โอนออก/ถอน/DR. Return date EXACTLY as it appears in the text (e.g. 01/02/69), do NOT convert. Return ONLY JSON.

${chunk}`;
            const result = await ollamaJSON(prompt);
            if (Array.isArray(result?.transactions)) {
                const normalized = result.transactions.map(t => ({
                    ...t,
                    date: normalizeDateStr(String(t.date)) ?? t.date,
                })).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t.date));
                allExtracted.push(...normalized);
                const dates = normalized.map(t => t.date).join(', ');
                log(`Ollama chunk ${offset}-${offset + CHUNK}: ${normalized.length} txns | dates: ${dates}`);
            }
        }
        catch (err) {
            log(`Ollama chunk ${offset} failed: ${err?.message}`);
        }
    }
    if (allExtracted.length > 0) {
        logger_1.logger.info(`Ollama extracted ${allExtracted.length} transactions total`);
        return allExtracted;
    }
    return parseTextFallback(text);
}
const FALLBACK_ALLOCATION = [
    { id: 'rent', th: 'ที่อยู่อาศัย', en: 'Housing', pct: 15 },
    { id: 'food', th: 'อาหาร', en: 'Groceries', pct: 10 },
    { id: 'commute', th: 'การเดินทาง', en: 'Transport', pct: 8 },
    { id: 'utility', th: 'สาธารณูปโภค', en: 'Utilities', pct: 7 },
    { id: 'health', th: 'สุขภาพ', en: 'Health', pct: 10 },
    { id: 'dining', th: 'ร้านอาหาร', en: 'Dining out', pct: 10 },
    { id: 'shopping', th: 'ช้อปปิ้ง', en: 'Shopping', pct: 8 },
    { id: 'fun', th: 'บันเทิง', en: 'Entertainment', pct: 5 },
    { id: 'subs', th: 'สมัครสมาชิก', en: 'Subscriptions', pct: 3 },
    { id: 'misc', th: 'อื่นๆ', en: 'Misc', pct: 4 },
    { id: 'savings', th: 'เก็บออม', en: 'Savings', pct: 20 },
];
async function generateRecommendedAllocation(transactions, totalIncome) {
    const byCat = {};
    for (const t of transactions) {
        byCat[t.catId] = (byCat[t.catId] ?? 0) + t.amount;
    }
    const summary = Object.entries(byCat)
        .map(([cat, amt]) => `${cat}: ฿${Math.round(amt).toLocaleString()}`)
        .join(', ');
    try {
        const prompt = `You are a Thai personal finance advisor.
Monthly income: ฿${totalIncome.toLocaleString()}
Current spending: ${summary}

Suggest an optimal monthly budget allocation. Adjust percentages based on the user's actual situation (do not blindly apply 50/30/20 if it does not fit).

Return a JSON object with key "allocations" containing an array where ALL percentages sum to exactly 100.
Each item must have:
- id: one of: rent, food, commute, utility, health, dining, shopping, fun, subs, misc, savings
- pct: recommended percentage of income (integer)
- amt: recommended monthly THB amount (integer)

Return ONLY: {"allocations": [...]}`;
        const result = await ollamaJSON(prompt);
        if (Array.isArray(result?.allocations) && result.allocations.length > 0) {
            return result.allocations.map(a => {
                const meta = FALLBACK_ALLOCATION.find(f => f.id === a.id) ?? { th: a.id, en: a.id };
                return { id: a.id, th: meta.th, en: meta.en, pct: a.pct, amt: a.amt };
            });
        }
    }
    catch (err) {
        logger_1.logger.warn(`Ollama allocation failed, using fallback: ${err?.message}`);
    }
    return FALLBACK_ALLOCATION.map(f => ({ ...f, amt: Math.round(totalIncome * f.pct / 100) }));
}
async function generateSpendingAnalysis(transactions) {
    if (transactions.length === 0)
        return 'ไม่มีข้อมูลธุรกรรมในเดือนนี้ กรุณาอัปโหลด statement ก่อน';
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0);
    const byCat = {};
    for (const t of transactions) {
        if (t.type !== 'income')
            byCat[t.catId] = (byCat[t.catId] ?? 0) + t.amount;
    }
    const breakdown = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `${cat}: ฿${Math.round(amt).toLocaleString()}`)
        .join(', ');
    const savingsAmt = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savingsAmt / totalIncome) * 100).toFixed(1) : '0';
    try {
        const prompt = `คุณเป็นที่ปรึกษาการเงินส่วนตัว วิเคราะห์การใช้เงินของผู้ใช้และให้คำแนะนำที่เป็นประโยชน์

ข้อมูลเดือนนี้:
- รายรับ: ฿${totalIncome.toLocaleString()}
- รายจ่ายรวม: ฿${totalExpenses.toLocaleString()}
- ออมได้: ฿${Math.round(savingsAmt).toLocaleString()} (${savingsRate}% ของรายรับ)
- รายละเอียดค่าใช้จ่ายแยกหมวด: ${breakdown}

เขียนบทวิเคราะห์ภาษาไทย 3-5 ประโยค ครอบคลุม:
1. ภาพรวมการใช้เงินและการออมเดือนนี้
2. หมวดหมู่ที่ควรระวังและเหตุผล
3. คำแนะนำที่ทำได้จริงเพื่อปรับปรุงการเงิน

ตอบเป็นข้อความต่อเนื่อง ไม่ต้องมี bullet point หรือหัวข้อ`;
        const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
        });
        if (!res.ok)
            throw new Error(`Ollama ${res.status}`);
        const data = await res.json();
        const text = data.response?.trim();
        if (text && text.length > 30)
            return text;
    }
    catch (err) {
        logger_1.logger.warn(`Ollama analysis failed, using fallback: ${err?.message}`);
    }
    return generateFallbackAnalysisText(byCat, totalIncome, totalExpenses);
}
function generateFallbackAnalysisText(byCat, totalIncome, totalExpenses) {
    const savingsAmt = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savingsAmt / totalIncome) * 100).toFixed(1) : '0';
    const topEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 2);
    let text = `เดือนนี้มีรายรับ ฿${totalIncome.toLocaleString()} รายจ่ายรวม ฿${Math.round(totalExpenses).toLocaleString()} `;
    if (savingsAmt > 0) {
        text += `ออมได้ ฿${Math.round(savingsAmt).toLocaleString()} คิดเป็น ${savingsRate}% ของรายรับ `;
        if (parseFloat(savingsRate) < 20)
            text += `ซึ่งยังต่ำกว่าเป้าหมาย 20% ที่แนะนำ `;
        else
            text += `อยู่ในเกณฑ์ดี `;
    }
    else {
        text += `รายจ่ายเกินรายรับ ฿${Math.round(Math.abs(savingsAmt)).toLocaleString()} ควรตรวจสอบรายจ่ายที่ไม่จำเป็น `;
    }
    if (topEntries.length > 0) {
        text += `หมวดที่ใช้จ่ายสูงสุดคือ ${topEntries.map(([cat, amt]) => `${cat} (฿${Math.round(amt).toLocaleString()})`).join(' และ ')} `;
    }
    if ((byCat.dining ?? 0) > totalIncome * 0.1) {
        text += `ค่าอาหารนอกบ้านค่อนข้างสูง ลองทำอาหารเองสัปดาห์ละ 3 วันเพื่อลดค่าใช้จ่าย`;
    }
    else if ((byCat.subs ?? 0) > 800) {
        text += `มีค่าสมาชิกรายเดือนหลายรายการ ลองตรวจสอบว่ายังใช้งานอยู่จริงทุกตัวหรือไม่`;
    }
    else {
        text += `แนะนำให้ติดตามรายจ่ายอย่างสม่ำเสมอและตั้งเป้าออมเพิ่มขึ้นเดือนละ 5%`;
    }
    return text;
}
function parseTextFallback(text) {
    const results = [];
    const lines = text.split('\n');
    const dateRe = /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/;
    const amtRe = /[\d,]+\.\d{2}/g;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 15)
            continue;
        if (trimmed.includes('รายการเดินบัญชี') || trimmed.includes('Account Statement'))
            continue;
        if (trimmed.includes('ยอดยกมา') || trimmed.includes('Brought Forward'))
            continue;
        const dateMatch = trimmed.match(dateRe);
        const amounts = trimmed.match(amtRe);
        if (!dateMatch || !amounts || amounts.length < 1)
            continue;
        const dateStr = normalizeDateStr(dateMatch[1]);
        if (!dateStr)
            continue;
        // Usually: [amount, balance] or [withdrawal, deposit, balance]
        let amount = 0;
        let balance = 0;
        let type = 'debit';
        const textOnLine = trimmed.toLowerCase();
        const incomeKeywords = ['เงินโอนเข้า', 'deposit', 'เงินฝาก', 'income', 'เงินเข้า', 'เครดิต', 'credit', 'education', 'กยศ', 'กองทุนให้กู้ยืม'];
        const expenseKeywords = ['จ่าย', 'ถอน', 'โอนเงินออก', 'transfer out', 'iorswt', 'withdrawal', 'expense', 'เดบิต', 'debit'];
        if (incomeKeywords.some(kw => textOnLine.includes(kw))) {
            type = 'credit';
        }
        else if (expenseKeywords.some(kw => textOnLine.includes(kw))) {
            type = 'debit';
        }
        if (amounts.length >= 2) {
            amount = parseFloat(amounts[0].replace(/,/g, ''));
            balance = parseFloat(amounts[amounts.length - 1].replace(/,/g, ''));
        }
        else {
            amount = parseFloat(amounts[0].replace(/,/g, ''));
        }
        if (isNaN(amount) || amount <= 0)
            continue;
        let merchant = trimmed.replace(dateRe, '').replace(amtRe, '').replace(/\s+/g, ' ').trim();
        // Clean up Thai bank specific noise
        merchant = merchant.replace(/Education Loan \(BSD\d+\)/, 'Education Loan');
        merchant = merchant.replace(/จ่ายค่าสินค้า\/บริการ \(.*?\)/, 'Shopping/Service');
        merchant = merchant.replace(/โอนเงินออก.*?\(.*?\)/, 'Transfer Out');
        if (merchant.length > 60)
            merchant = merchant.slice(0, 57) + '...';
        if (!merchant || merchant.length < 2)
            merchant = 'Unknown Merchant';
        results.push({ date: dateStr, merchant, amount, type, balance, note: trimmed.slice(0, 100) });
    }
    return results;
}
function normalizeDateStr(raw) {
    const parts = raw.includes('-') ? raw.split('-') : raw.split('/');
    if (parts.length !== 3)
        return null;
    let d, m, y;
    if (parts[0].length === 4) {
        [y, m, d] = parts;
    }
    else {
        [d, m, y] = parts;
    }
    let year = parseInt(y, 10);
    // If year is 2 digits (e.g., '69' for 2569 BE)
    if (y.length === 2) {
        if (year > 50)
            year += 2500; // 69 -> 2569
        else
            year += 2000; // 24 -> 2024 (unlikely for BE but safe)
    }
    // Handle Thai Buddhist Era (BE)
    if (year >= 2400)
        year -= 543;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
