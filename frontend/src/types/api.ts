export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type PDFStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface PDFStatement {
  id: string;
  originalName: string;
  status: PDFStatus;
  month?: string;
  createdAt: string;
}
export interface Transaction {
  id: string;
  userId: string;
  pdfId?: string;
  date: string;
  merchant: string;
  amount: number;
  balance?: number;
  catId: string;
  type: 'needs' | 'wants' | 'income';
  note?: string;
  manual: boolean;
  createdAt: string;
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

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  needsTotal: number;
  wantsTotal: number;
  savingsRate: number;
  categories: CategorySummary[];
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

export interface IncomeSource {
  id: string;
  nameEn: string;
  nameTh?: string;
  amount: number;
  type: 'salary' | 'side' | 'investment' | 'bonus' | 'other';
  dayOfMonth: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  nameEn: string;
  nameTh?: string;
  target: number;
  saved: number;
  byMonths: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}
