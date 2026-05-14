import { db } from '../db/store';
import { Transaction, TxnType } from '../db/models';
import { categorize } from './ai.service';
import { ExtractedTransaction } from '../types';

export function getTransactions(
  userId: string,
  opts: { month?: string; catId?: string; page?: number; limit?: number } = {}
) {
  return db.findTransactionsByUser(userId, opts);
}

export function createTransaction(
  userId: string,
  data: {
    date: string;
    merchant: string;
    amount: number;
    catId?: string;
    type?: TxnType;
    note?: string;
  }
) {
  const { catId, type } = data.catId
    ? { catId: data.catId, type: data.type ?? 'wants' }
    : categorize(data.merchant, data.note);

  return db.createTransaction({
    userId,
    date: data.date,
    merchant: data.merchant,
    amount: data.amount,
    catId,
    type: type as TxnType,
    note: data.note,
    manual: true,
  });
}

export function updateTransaction(
  id: string,
  userId: string,
  data: Partial<Pick<Transaction, 'date' | 'merchant' | 'amount' | 'catId' | 'type' | 'note'>>
) {
  const updated = db.updateTransaction(id, userId, data);
  if (!updated) throw Object.assign(new Error('Transaction not found'), { status: 404 });
  return updated;
}

export function deleteTransaction(id: string, userId: string) {
  const deleted = db.deleteTransaction(id, userId);
  if (!deleted) throw Object.assign(new Error('Transaction not found'), { status: 404 });
}

export function importExtractedTransactions(
  userId: string,
  pdfId: string,
  extracted: ExtractedTransaction[]
): Transaction[] {
  // 1. Get existing transactions for this user for the months covered by 'extracted'
  const months = [...new Set(extracted
    .filter(t => typeof t.date === 'string' && t.date.length >= 7)
    .map(t => t.date.slice(0, 7))
  )];
  
  const existing = months.flatMap(m => db.findTransactionsByUser(userId, { month: m, limit: 9999 }).items);

  const toImport: any[] = [];
  
  for (const t of extracted) {
    // Basic validation
    if (!t.date || !t.merchant || typeof t.amount !== 'number' || isNaN(t.amount)) continue;
    if (t.amount <= 0) continue;

    // Deduplication: check against DB and current batch
    const isDupInDB = existing.some(e => 
      e.date === t.date && 
      Math.abs(e.amount - t.amount) < 0.01 &&
      e.merchant.toLowerCase().trim() === t.merchant.toLowerCase().trim()
    );
    
    const isDupInBatch = toImport.some(i => 
      i.date === t.date && 
      Math.abs(i.amount - t.amount) < 0.01 &&
      i.merchant.toLowerCase().trim() === t.merchant.toLowerCase().trim()
    );

    if (!isDupInDB && !isDupInBatch) {
      const { catId, type } = categorize(t.merchant, t.note, t.type);
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

  if (toImport.length === 0) return [];
  return db.createManyTransactions(toImport);
}
