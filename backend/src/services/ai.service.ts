import fs from 'fs';
import path from 'path';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logger } from '../utils/logger';
import { ExtractedTransaction, AIRecommendation } from '../types';
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
  income:   { en: 'Income',        th: 'รายได้',      type: 'income', keywords: ['deposit', 'เงินเข้า', 'เงินโอนเข้า', 'salary', 'เงินเดือน', 'dividend', 'interest'] },
};

export function getCategoryList() {
  return Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }));
}

export function categorize(merchant: string, note?: string, type?: 'debit' | 'credit'): { catId: string; type: 'needs' | 'wants' | 'income' } {
  if (type === 'credit') return { catId: 'income', type: 'income' };
  
  const text = `${merchant} ${note ?? ''}`.toLowerCase();
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

CRITICAL: Look for keywords like "เงินโอนเข้า", "Deposit", "CR" for credit. Look for "จ่าย", "โอนเงินออก", "ถอน", "DR" for debit.

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

export async function generateRecommendations(
  transactions: Transaction[],
  incomeSources: { amount: number }[]
): Promise<AIRecommendation[]> {
  const totalIncome = incomeSources.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = transactions.reduce((s, t) => s + t.amount, 0);

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
Monthly expenses: ฿${totalExpenses.toLocaleString()} broken down as ${summary}.

Generate 3-5 specific, actionable saving recommendations.
Return a JSON object with key "recommendations" containing an array. Each item must have:
- id: short unique string
- title: short English title
- description: 1-2 sentence actionable advice in English
- potentialSaving: estimated monthly THB saving (number)
- category: one of the spending categories
- priority: "high" or "medium" or "low"

Return ONLY: {"recommendations": [...]}`;

    const result = await ollamaJSON<{ recommendations?: AIRecommendation[] }>(prompt);
    if (Array.isArray(result?.recommendations) && result.recommendations.length > 0) {
      return result.recommendations;
    }
  } catch (err: any) {
    logger.warn(`Ollama recommendations failed, using fallback: ${err?.message}`);
  }

  return generateFallbackRecommendations(byCat, totalIncome, totalExpenses);
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
    const incomeKeywords = ['เงินโอนเข้า', 'deposit', 'เงินฝาก', 'income', 'เงินเข้า', 'เครดิต', 'credit','Education Loan', 'เงินโอน'];
    const expenseKeywords = ['จ่าย', 'ถอน', 'โอนเงินออก', 'withdrawal', 'expense', 'เดบิต', 'debit'];

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

function generateFallbackRecommendations(
  byCat: Record<string, number>,
  totalIncome: number,
  totalExpenses: number
): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const savingsGap = totalIncome * 0.2 - (totalIncome - totalExpenses);

  if ((byCat.dining ?? 0) > totalIncome * 0.1) {
    recs.push({
      id: 'reduce-dining',
      title: 'Reduce food delivery orders',
      description: `Your dining out spend is ฿${Math.round(byCat.dining ?? 0).toLocaleString()}/month. Cooking at home 3 more days per week could save ฿${Math.round((byCat.dining ?? 0) * 0.25).toLocaleString()}.`,
      potentialSaving: Math.round((byCat.dining ?? 0) * 0.25),
      category: 'dining',
      priority: 'high',
    });
  }
  if ((byCat.subs ?? 0) > 800) {
    recs.push({
      id: 'audit-subs',
      title: 'Audit subscriptions',
      description: `You're spending ฿${Math.round(byCat.subs ?? 0).toLocaleString()}/month on subscriptions. Cancel unused ones to potentially save ฿${Math.round((byCat.subs ?? 0) * 0.4).toLocaleString()}.`,
      potentialSaving: Math.round((byCat.subs ?? 0) * 0.4),
      category: 'subs',
      priority: 'medium',
    });
  }
  if (savingsGap > 0) {
    recs.push({
      id: 'savings-gap',
      title: 'Close the savings gap',
      description: `You need to save ฿${Math.round(savingsGap).toLocaleString()} more/month to hit a 20% savings rate. Review wants categories to find cuts.`,
      potentialSaving: Math.round(savingsGap),
      category: 'misc',
      priority: 'high',
    });
  }
  return recs;
}
