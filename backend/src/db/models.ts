export type Role = 'USER' | 'ADMIN';
export type PDFStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type IncomeType = 'salary' | 'side' | 'investment' | 'bonus' | 'other';
export type Priority = 'low' | 'medium' | 'high';
export type TxnType = 'needs' | 'wants' | 'income';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface PDFStatement {
  id: string;
  userId: string;
  originalName: string;
  encryptedPath: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  passwordHash: string;
  status: PDFStatus;
  month?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PDFAccessSession {
  id: string;
  pdfId: string;
  token: string;
  expiresAt: string;
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
  type: TxnType;
  note?: string;
  manual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSource {
  id: string;
  userId: string;
  nameTh?: string;
  nameEn: string;
  amount: number;
  type: IncomeType;
  dayOfMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  nameTh?: string;
  nameEn: string;
  target: number;
  saved: number;
  byMonths: number;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}
