import { db } from '../db/store';
import { getCategoryList } from './ai.service';

export function getMonthlySummary(userId: string, month: string) {
  const { items: transactions } = db.findTransactionsByUser(userId, { month, limit: 9999 });
  const incomeSources = db.findIncomeSources(userId);
  const categories = getCategoryList();

  const expenses = transactions.filter(t => t.type !== 'income');
  const pdfIncome = transactions.filter(t => t.type === 'income');

  const totalIncome = incomeSources.reduce((s, i) => s + i.amount, 0) + pdfIncome.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  
  const needsTotal = expenses.filter(t => t.type === 'needs').reduce((s, t) => s + t.amount, 0);
  const wantsTotal = expenses.filter(t => t.type === 'wants').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Ending balance: balance of the latest transaction in this month
  const sortedTxns = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const latestTxn = sortedTxns.find(t => t.balance !== undefined);
  const endingBalance = latestTxn?.balance ?? 0;

  const byCat: Record<string, { amt: number; txns: number }> = {};
  for (const t of expenses) {
    if (!byCat[t.catId]) byCat[t.catId] = { amt: 0, txns: 0 };
    byCat[t.catId].amt += t.amount;
    byCat[t.catId].txns += 1;
  }

  const categorySummaries = categories
    .filter(cat => cat.id !== 'income')
    .map(cat => ({
      id: cat.id,
      en: cat.en,
      th: cat.th,
      type: cat.type as any,
      amt: Math.round(byCat[cat.id]?.amt ?? 0),
      txns: byCat[cat.id]?.txns ?? 0,
      trend: 0,
    })).filter(c => c.txns > 0);

  return {
    month,
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    needsTotal: Math.round(needsTotal),
    wantsTotal: Math.round(wantsTotal),
    savingsRate: parseFloat(savingsRate.toFixed(1)),
    endingBalance: Math.round(endingBalance),
    categories: categorySummaries,
  };
}

export function getDailySpending(userId: string, month: string): number[] {
  const { items: transactions } = db.findTransactionsByUser(userId, { month, limit: 9999 });
  const expenses = transactions.filter(t => t.type !== 'income');
  
  const parts = month.split('-').map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return [];
  }
  
  const [year, mon] = parts;
  const daysInMonth = new Date(year, mon, 0).getDate();
  if (isNaN(daysInMonth) || daysInMonth <= 0) return [];
  
  const daily = new Array(daysInMonth).fill(0);

  for (const t of expenses) {
    if (!t.date || typeof t.date !== 'string') continue;
    const dateParts = t.date.split('-');
    if (dateParts.length < 3) continue;
    
    const day = parseInt(dateParts[2], 10) - 1;
    if (day >= 0 && day < daysInMonth) daily[day] += t.amount;
  }

  return daily.map(v => Math.round(v));
}

export function getSpendingLeaks(userId: string, month: string) {
  const { items: transactions } = db.findTransactionsByUser(userId, { month, limit: 9999 });
  const expenses = transactions.filter(t => t.type !== 'income');
  
  const summary = getMonthlySummary(userId, month);
  const totalIncome = summary.totalIncome;
  const categories = getCategoryList();

  const byCat: Record<string, number> = {};
  for (const t of expenses) {
    byCat[t.catId] = (byCat[t.catId] ?? 0) + t.amount;
  }

  const budgetRules: Record<string, number> = {
    dining: 0.08, shopping: 0.08, subs: 0.03, fun: 0.05,
  };

  const leaks = Object.entries(budgetRules)
    .map(([catId, maxPct]) => {
      const spent = byCat[catId] ?? 0;
      const budget = totalIncome * maxPct;
      const over = spent - budget;
      if (over <= 0) return null;
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId,
        en: cat?.en ?? catId,
        th: cat?.th ?? catId,
        detail: `Spent ฿${Math.round(spent).toLocaleString()} vs budget ฿${Math.round(budget).toLocaleString()}`,
        detailEn: `Spent ฿${Math.round(spent).toLocaleString()} — budget ฿${Math.round(budget).toLocaleString()}`,
        amt: Math.round(spent),
        over: Math.round(over),
        severity: over > budget * 0.5 ? 'high' : over > budget * 0.2 ? 'medium' : 'low',
        cat: catId,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.over - a!.over));

  return leaks;
}

export function getIncomeSourcesSummary(userId: string) {
  return db.findIncomeSources(userId);
}

export function getGoalsSummary(userId: string) {
  return db.findGoals(userId);
}
