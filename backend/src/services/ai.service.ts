import fs from 'fs';
import path from 'path';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logger } from '../utils/logger';
import { ExtractedTransaction } from '../types';
import { Transaction } from '../db/models';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma3';

async function ollamaJSON<T>(prompt: string): Promise<T> {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, format: 'json', stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json() as { response: string };
  return JSON.parse(data.response) as T;
}

const CATEGORIES: Record<string, { en: string; th: string; type: 'needs' | 'wants' | 'income'; keywords: string[] }> = {
  rent:     { en: 'Housing',       th: 'ที่อยู่อาศัย', type: 'needs', keywords: ['rent','property','apartment','condo','house','housing'] },
  food:     { en: 'Groceries',     th: 'อาหาร',        type: 'needs', keywords: ['tesco','lotuss','foodland','big c','tops','villa market','7-eleven','cpall','family mart','makro','cj express'] },
  commute:  { en: 'Transport',     th: 'การเดินทาง',   type: 'needs', keywords: ['bts','mrt','grab*ride','bolt','ptt','shell','bangchak','taxi','rabbit','skytrain'] },
  utility:  { en: 'Utilities',     th: 'สาธารณูปโภค', type: 'needs', keywords: ['pea','mea','ais','true internet','dtac','3bb','ais-postpaid','electric','water'] },
  health:   { en: 'Health',        th: 'สุขภาพ',       type: 'needs', keywords: ['bumrungrad','watsons','boots','pharmacy','hospital','clinic','medical'] },
  dining:   { en: 'Dining out',    th: 'ร้านอาหาร',    type: 'wants', keywords: ['grab food','grabfood','lineman','foodpanda','after you','cafe amazon','starbucks','sukishi','bonchon','kfc','mk restaurant','yayoi','mcdonald','burger','pizza'] },
  shopping: { en: 'Shopping',      th: 'ช้อปปิ้ง',     type: 'wants', keywords: ['shopee','lazada','ikea','uniqlo','zara','h&m','central','robinson','daiso'] },
  fun:      { en: 'Entertainment', th: 'บันเทิง',      type: 'wants', keywords: ['major','sf cinema','steam','nintendo','playstation','concert','asiatique','cinema'] },
  subs:     { en: 'Subscriptions', th: 'สมัครสมาชิก',  type: 'wants', keywords: ['netflix','disney+','spotify','youtube premium','apple tv','icloud','adobe','notion','canva'] },
  misc:     { en: 'Misc',          th: 'อื่นๆ',        type: 'wants', keywords: ['atm fee','bank charge','fee','charge','misc','gift'] },
  income:   { en: 'Income',        th: 'รายได้',      type: 'income', keywords: ['deposit', 'เงินเข้า', 'เงินโอนเข้า', 'salary', 'เงินเดือน', 'dividend', 'interest', 'กยศ', 'กองทุนให้กู้ยืม', 'education loan'] },
};

export function getCategoryList() {
  return Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));
}

export function categorize(merchant: string, note?: string, type?: 'debit' | 'credit'): { catId: string; type: 'needs' | 'wants' | 'income' } {
  const text = `${merchant} ${note ?? ''}`.toLowerCase();

  // Outgoing transfers are never income regardless of AI-extracted type
  const outgoingRe = /โอนเงินออก|transfer out|iorswt|morisw|morwsw|nmidsw/;
  if (outgoingRe.test(text)) return { catId: 'misc', type: 'wants' };

  if (type === 'credit') return { catId: 'income', type: 'income' };
  for (const [id, cat] of Object.entries(CATEGORIES)) {
    if (cat.keywords.some(kw => text.includes(kw))) {
      return { catId: id, type: cat.type as any };
    }
  }
  return { catId: 'misc', type: 'wants' };
}

export async function extractTransactionsFromPDF(buffer: Buffer, bankPassword?: string): Promise<ExtractedTransaction[]> {
  const logFile = path.resolve(__dirname, '../../extraction.log');
  const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  
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
      const items = content.items as any[];
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
  } catch (err: any) {
    log(`PDF extraction error: ${err.message || err.name || JSON.stringify(err)}`);
    console.error('PDF extraction error details:', err);
    logger.warn('PDF extraction failed — wrong bank password or unsupported format', { err });
    throw new Error('ไม่สามารถอ่าน PDF ได้ — ตรวจสอบรหัสผ่าน PDF จากธนาคาร');
  }

  try {
    const prompt = `You are a financial data extraction assistant for Thai bank statements.
Extract ALL transactions from the following bank statement text and return a JSON object with key "transactions" containing an array.

For each transaction provide:
- date: ISO date string YYYY-MM-DD
- merchant: merchant/payee name (clean, no codes)
- amount: absolute numeric value (no currency symbols)
- type: "debit" for expenses/withdrawals (ถอน/จ่าย/โอนออก), "credit" for income/deposits (ฝาก/เงินเข้า/โอนเข้า)
- balance: the running balance (ยอดเงินคงเหลือ) after this transaction (numeric value)
- note: original description text

CRITICAL: Look for keywords like "เงินโอนเข้า", "Deposit", "CR", "Education Loan", "กยศ", "กองทุนให้กู้ยืม" for credit. Look for "จ่าย", "โอนเงินออก", "ถอน", "DR" for debit.

Return ONLY a valid JSON object like: {"transactions": [...]}

Bank statement text:
${text.slice(0, 10000)}`;

    const result = await ollamaJSON<{ transactions?: ExtractedTransaction[] }>(prompt);
    if (Array.isArray(result?.transactions) && result.transactions.length > 0) {
      logger.info(`Ollama extracted ${result.transactions.length} transactions`);
      return result.transactions;
    }
  } catch (err: any) {
    logger.warn(`Ollama extraction failed, using fallback: ${err?.message}`);
  }

  return parseTextFallback(text);
}

const FALLBACK_ALLOCATION = [
  { id: 'rent',     th: 'ที่อยู่อาศัย', en: 'Housing',       pct: 15 },
  { id: 'food',     th: 'อาหาร',        en: 'Groceries',     pct: 10 },
  { id: 'commute',  th: 'การเดินทาง',   en: 'Transport',     pct:  8 },
  { id: 'utility',  th: 'สาธารณูปโภค', en: 'Utilities',     pct:  7 },
  { id: 'health',   th: 'สุขภาพ',       en: 'Health',        pct: 10 },
  { id: 'dining',   th: 'ร้านอาหาร',    en: 'Dining out',    pct: 10 },
  { id: 'shopping', th: 'ช้อปปิ้ง',     en: 'Shopping',      pct:  8 },
  { id: 'fun',      th: 'บันเทิง',      en: 'Entertainment', pct:  5 },
  { id: 'subs',     th: 'สมัครสมาชิก',  en: 'Subscriptions', pct:  3 },
  { id: 'misc',     th: 'อื่นๆ',        en: 'Misc',          pct:  4 },
  { id: 'savings',  th: 'เก็บออม',      en: 'Savings',       pct: 20 },
];

export async function generateRecommendedAllocation(
  transactions: Transaction[],
  totalIncome: number
): Promise<{ id: string; th: string; en: string; pct: number; amt: number }[]> {
  const byCat: Record<string, number> = {};
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

    const result = await ollamaJSON<{ allocations?: { id: string; pct: number; amt: number }[] }>(prompt);
    if (Array.isArray(result?.allocations) && result.allocations.length > 0) {
      return result.allocations.map(a => {
        const meta = FALLBACK_ALLOCATION.find(f => f.id === a.id) ?? { th: a.id, en: a.id };
        return { id: a.id, th: meta.th, en: meta.en, pct: a.pct, amt: a.amt };
      });
    }
  } catch (err: any) {
    logger.warn(`Ollama allocation failed, using fallback: ${err?.message}`);
  }

  return FALLBACK_ALLOCATION.map(f => ({ ...f, amt: Math.round(totalIncome * f.pct / 100) }));
}

export async function generateSpendingAnalysis(
  transactions: Transaction[]
): Promise<string> {
  if (transactions.length === 0) return 'ไม่มีข้อมูลธุรกรรมในเดือนนี้ กรุณาอัปโหลด statement ก่อน';

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0);

  const byCat: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== 'income') byCat[t.catId] = (byCat[t.catId] ?? 0) + t.amount;
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
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json() as { response: string };
    const text = data.response?.trim();
    if (text && text.length > 30) return text;
  } catch (err: any) {
    logger.warn(`Ollama analysis failed, using fallback: ${err?.message}`);
  }

  return generateFallbackAnalysisText(byCat, totalIncome, totalExpenses);
}

function generateFallbackAnalysisText(
  byCat: Record<string, number>,
  totalIncome: number,
  totalExpenses: number
): string {
  const savingsAmt = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((savingsAmt / totalIncome) * 100).toFixed(1) : '0';
  const topEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 2);

  let text = `เดือนนี้มีรายรับ ฿${totalIncome.toLocaleString()} รายจ่ายรวม ฿${Math.round(totalExpenses).toLocaleString()} `;
  if (savingsAmt > 0) {
    text += `ออมได้ ฿${Math.round(savingsAmt).toLocaleString()} คิดเป็น ${savingsRate}% ของรายรับ `;
    if (parseFloat(savingsRate) < 20) text += `ซึ่งยังต่ำกว่าเป้าหมาย 20% ที่แนะนำ `;
    else text += `อยู่ในเกณฑ์ดี `;
  } else {
    text += `รายจ่ายเกินรายรับ ฿${Math.round(Math.abs(savingsAmt)).toLocaleString()} ควรตรวจสอบรายจ่ายที่ไม่จำเป็น `;
  }
  if (topEntries.length > 0) {
    text += `หมวดที่ใช้จ่ายสูงสุดคือ ${topEntries.map(([cat, amt]) => `${cat} (฿${Math.round(amt).toLocaleString()})`).join(' และ ')} `;
  }
  if ((byCat.dining ?? 0) > totalIncome * 0.1) {
    text += `ค่าอาหารนอกบ้านค่อนข้างสูง ลองทำอาหารเองสัปดาห์ละ 3 วันเพื่อลดค่าใช้จ่าย`;
  } else if ((byCat.subs ?? 0) > 800) {
    text += `มีค่าสมาชิกรายเดือนหลายรายการ ลองตรวจสอบว่ายังใช้งานอยู่จริงทุกตัวหรือไม่`;
  } else {
    text += `แนะนำให้ติดตามรายจ่ายอย่างสม่ำเสมอและตั้งเป้าออมเพิ่มขึ้นเดือนละ 5%`;
  }
  return text;
}

function parseTextFallback(text: string): ExtractedTransaction[] {
  const results: ExtractedTransaction[] = [];
  const lines = text.split('\n');
  const dateRe = /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/;
  const amtRe = /[\d,]+\.\d{2}/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 15) continue;
    if (trimmed.includes('รายการเดินบัญชี') || trimmed.includes('Account Statement')) continue;
    if (trimmed.includes('ยอดยกมา') || trimmed.includes('Brought Forward')) continue;

    const dateMatch = trimmed.match(dateRe);
    const amounts = trimmed.match(amtRe);
    if (!dateMatch || !amounts || amounts.length < 1) continue;

    const dateStr = normalizeDateStr(dateMatch[1]);
    if (!dateStr) continue;

    // Usually: [amount, balance] or [withdrawal, deposit, balance]
    let amount = 0;
    let balance = 0;
    let type: 'debit' | 'credit' = 'debit';
    
    const textOnLine = trimmed.toLowerCase();
    const incomeKeywords = ['เงินโอนเข้า', 'deposit', 'เงินฝาก', 'income', 'เงินเข้า', 'เครดิต', 'credit', 'education', 'กยศ', 'กองทุนให้กู้ยืม'];
    const expenseKeywords = ['จ่าย', 'ถอน', 'โอนเงินออก', 'transfer out', 'iorswt', 'withdrawal', 'expense', 'เดบิต', 'debit'];

    if (incomeKeywords.some(kw => textOnLine.includes(kw))) {
      type = 'credit';
    } else if (expenseKeywords.some(kw => textOnLine.includes(kw))) {
      type = 'debit';
    }

    if (amounts.length >= 2) {
      amount = parseFloat(amounts[0].replace(/,/g, ''));
      balance = parseFloat(amounts[amounts.length - 1].replace(/,/g, ''));
    } else {
      amount = parseFloat(amounts[0].replace(/,/g, ''));
    }

    if (isNaN(amount) || amount <= 0) continue;

    let merchant = trimmed.replace(dateRe, '').replace(amtRe, '').replace(/\s+/g, ' ').trim();
    // Clean up Thai bank specific noise
    merchant = merchant.replace(/Education Loan \(BSD\d+\)/, 'Education Loan');
    merchant = merchant.replace(/จ่ายค่าสินค้า\/บริการ \(.*?\)/, 'Shopping/Service');
    merchant = merchant.replace(/โอนเงินออก.*?\(.*?\)/, 'Transfer Out');
    
    if (merchant.length > 60) merchant = merchant.slice(0, 57) + '...';
    if (!merchant || merchant.length < 2) merchant = 'Unknown Merchant';

    results.push({ date: dateStr, merchant, amount, type, balance, note: trimmed.slice(0, 100) });
  }
  return results;
}

function normalizeDateStr(raw: string): string | null {
  const parts = raw.includes('-') ? raw.split('-') : raw.split('/');
  if (parts.length !== 3) return null;

  let d, m, y;
  if (parts[0].length === 4) { [y, m, d] = parts; } 
  else { [d, m, y] = parts; }

  let year = parseInt(y, 10);
  
  // If year is 2 digits (e.g., '69' for 2569 BE)
  if (y.length === 2) {
    if (year > 50) year += 2500; // 69 -> 2569
    else year += 2000; // 24 -> 2024 (unlikely for BE but safe)
  }
  
  // Handle Thai Buddhist Era (BE)
  if (year >= 2400) year -= 543;

  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

