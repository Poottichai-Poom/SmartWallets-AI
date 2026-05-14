import { Request } from 'express';

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface TransactionData {
  date: string;
  merchant: string;
  amount: number;
  catId: string;
  type: 'needs' | 'wants';
  note?: string;
}

export interface CategorySummary {
  id: string;
  en: string;
  th: string;
  type: 'needs' | 'wants';
  amt: number;
  txns: number;
  trend: number;
}

export interface FinancialSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  needsTotal: number;
  wantsTotal: number;
  savingsRate: number;
  endingBalance: number;
  categories: CategorySummary[];
  daily: number[];
}

export interface SpendingLeak {
  id: string;
  en: string;
  th: string;
  detail: string;
  detailEn: string;
  amt: number;
  over: number;
  severity: 'high' | 'medium' | 'low';
  cat: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSaving: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  note: string;
  balance?: number;
}
