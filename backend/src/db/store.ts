import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  User, RefreshToken, PDFStatement, PDFAccessSession,
  Transaction, IncomeSource, Goal, AuditLog, MerchantMapping,
} from './models';

interface StoreData {
  users: User[];
  refreshTokens: RefreshToken[];
  pdfStatements: PDFStatement[];
  pdfAccessSessions: PDFAccessSession[];
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  goals: Goal[];
  auditLogs: AuditLog[];
  merchantMappings: MerchantMapping[];
}

function now() { return new Date().toISOString(); }

class Store {
  private data: StoreData;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(process.env.DB_FILE ?? './data/db.json');
    this.data = this.load();
    this.migrateOutgoingTransfers();
  }

  private load(): StoreData {
    const empty: StoreData = {
      users: [], refreshTokens: [], pdfStatements: [],
      pdfAccessSessions: [], transactions: [],
      incomeSources: [], goals: [], auditLogs: [], merchantMappings: [],
    };
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch { /* start fresh */ }
    return empty;
  }

  private migrateOutgoingTransfers() {
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
    if (changed) this.persist();
  }

  persist() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const user: User = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
    this.data.users.push(user);
    this.persist();
    return user;
  }

  listUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash: _, ...u }) => u);
  }

  // ── Refresh Tokens ─────────────────────────────────────────────────────────
  createRefreshToken(userId: string, token: string, expiresAt: string): RefreshToken {
    const rt: RefreshToken = { id: uuidv4(), token, userId, expiresAt, createdAt: now() };
    this.data.refreshTokens.push(rt);
    this.persist();
    return rt;
  }

  findRefreshToken(token: string): RefreshToken | undefined {
    return this.data.refreshTokens.find(rt => rt.token === token);
  }

  deleteRefreshToken(token: string) {
    this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.token !== token);
    this.persist();
  }

  deleteUserRefreshTokens(userId: string) {
    this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.userId !== userId);
    this.persist();
  }

  // ── PDF Statements ─────────────────────────────────────────────────────────
  createPDF(data: Omit<PDFStatement, 'id' | 'createdAt' | 'updatedAt'>): PDFStatement {
    const pdf: PDFStatement = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
    this.data.pdfStatements.push(pdf);
    this.persist();
    return pdf;
  }

  findPDFById(id: string): PDFStatement | undefined {
    return this.data.pdfStatements.find(p => p.id === id);
  }

  findPDFsByUser(userId: string): PDFStatement[] {
    return this.data.pdfStatements.filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  updatePDFStatus(id: string, status: PDFStatement['status']) {
    const pdf = this.data.pdfStatements.find(p => p.id === id);
    if (pdf) { pdf.status = status; pdf.updatedAt = now(); this.persist(); }
  }

  deletePDF(id: string) {
    this.data.pdfStatements = this.data.pdfStatements.filter(p => p.id !== id);
    this.persist();
  }

  // ── PDF Access Sessions ────────────────────────────────────────────────────
  createPDFSession(pdfId: string, token: string, expiresAt: string): PDFAccessSession {
    const session: PDFAccessSession = { id: uuidv4(), pdfId, token, expiresAt, createdAt: now() };
    this.data.pdfAccessSessions.push(session);
    this.persist();
    return session;
  }

  findPDFSession(token: string): PDFAccessSession | undefined {
    return this.data.pdfAccessSessions.find(s => s.token === token);
  }

  deletePDFSessions(pdfId: string) {
    this.data.pdfAccessSessions = this.data.pdfAccessSessions.filter(s => s.pdfId !== pdfId);
    this.persist();
  }

  deleteExpiredPDFSessions() {
    this.data.pdfAccessSessions = this.data.pdfAccessSessions.filter(
      s => new Date(s.expiresAt) > new Date()
    );
    this.persist();
  }

  // ── Transactions ───────────────────────────────────────────────────────────
  createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const txn: Transaction = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
    this.data.transactions.push(txn);
    this.persist();
    return txn;
  }

  createManyTransactions(items: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Transaction[] {
    const txns = items.map(data => ({
      ...data, id: uuidv4(), createdAt: now(), updatedAt: now(),
    } as Transaction));
    this.data.transactions.push(...txns);
    this.persist();
    return txns;
  }

  findTransactionById(id: string): Transaction | undefined {
    return this.data.transactions.find(t => t.id === id);
  }

  findTransactionsByUser(
    userId: string,
    opts: { month?: string; catId?: string; page?: number; limit?: number } = {}
  ): { items: Transaction[]; total: number } {
    let results = this.data.transactions.filter(t => {
      if (t.userId !== userId) return false;
      if (opts.month && !t.date.startsWith(opts.month)) return false;
      if (opts.catId && t.catId !== opts.catId) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const total = results.length;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 50;
    results = results.slice((page - 1) * limit, page * limit);
    return { items: results, total };
  }

  updateTransaction(id: string, userId: string, data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>): Transaction | null {
    const txn = this.data.transactions.find(t => t.id === id && t.userId === userId);
    if (!txn) return null;
    Object.assign(txn, data, { updatedAt: now() });
    this.persist();
    return txn;
  }

  deleteTransaction(id: string, userId: string): boolean {
    const before = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(t => !(t.id === id && t.userId === userId));
    const deleted = this.data.transactions.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  deleteTransactionsByPdf(pdfId: string, userId: string): number {
    const before = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(t => !(t.pdfId === pdfId && t.userId === userId));
    const deletedCount = before - this.data.transactions.length;
    if (deletedCount > 0) this.persist();
    return deletedCount;
  }

  // ── Income Sources ─────────────────────────────────────────────────────────
  createIncomeSource(data: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>): IncomeSource {
    const src: IncomeSource = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
    this.data.incomeSources.push(src);
    this.persist();
    return src;
  }

  findIncomeSources(userId: string): IncomeSource[] {
    return this.data.incomeSources.filter(s => s.userId === userId);
  }

  updateIncomeSource(id: string, userId: string, data: Partial<Omit<IncomeSource, 'id' | 'userId' | 'createdAt'>>): IncomeSource | null {
    const src = this.data.incomeSources.find(s => s.id === id && s.userId === userId);
    if (!src) return null;
    Object.assign(src, data, { updatedAt: now() });
    this.persist();
    return src;
  }

  deleteIncomeSource(id: string, userId: string): boolean {
    const before = this.data.incomeSources.length;
    this.data.incomeSources = this.data.incomeSources.filter(s => !(s.id === id && s.userId === userId));
    const deleted = this.data.incomeSources.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    const goal: Goal = { ...data, id: uuidv4(), createdAt: now(), updatedAt: now() };
    this.data.goals.push(goal);
    this.persist();
    return goal;
  }

  findGoals(userId: string): Goal[] {
    return this.data.goals.filter(g => g.userId === userId);
  }

  updateGoal(id: string, userId: string, data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>): Goal | null {
    const goal = this.data.goals.find(g => g.id === id && g.userId === userId);
    if (!goal) return null;
    Object.assign(goal, data, { updatedAt: now() });
    this.persist();
    return goal;
  }

  deleteGoal(id: string, userId: string): boolean {
    const before = this.data.goals.length;
    this.data.goals = this.data.goals.filter(g => !(g.id === id && g.userId === userId));
    const deleted = this.data.goals.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // ── Merchant Mappings ──────────────────────────────────────────────────────
  upsertMerchantMapping(userId: string, merchantKey: string, catId: string, type: MerchantMapping['type']) {
    if (!this.data.merchantMappings) this.data.merchantMappings = [];
    const existing = this.data.merchantMappings.find(m => m.userId === userId && m.merchantKey === merchantKey);
    if (existing) {
      existing.catId = catId;
      existing.type = type;
      existing.updatedAt = now();
    } else {
      this.data.merchantMappings.push({ id: uuidv4(), userId, merchantKey, catId, type, updatedAt: now() });
    }
    this.persist();
  }

  findMerchantMapping(userId: string, merchantKey: string): MerchantMapping | undefined {
    if (!this.data.merchantMappings) return undefined;
    return this.data.merchantMappings.find(m => m.userId === userId && m.merchantKey === merchantKey);
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  createAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = { ...data, id: uuidv4(), createdAt: now() };
    this.data.auditLogs.push(log);
    if (this.data.auditLogs.length % 100 === 0) this.persist();
    return log;
  }

  findAuditLogs(page = 1, limit = 50): { logs: AuditLog[]; total: number } {
    const sorted = [...this.data.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      logs: sorted.slice((page - 1) * limit, page * limit),
      total: sorted.length,
    };
  }
}

export const db = new Store();
