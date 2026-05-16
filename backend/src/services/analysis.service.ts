import { db } from '../db/store';
import { getCategoryList } from './ai.service';

export function getMonthlySummary(userId: string, month: string) {
  const { items: transactions } = db.findTransactionsByUser(userId, { month, limit: 9999 });
  const categories = getCategoryList();

  const expenses = transactions.filter(t => t.type !== 'income');
  const pdfIncome = transactions.filter(t => t.type === 'income');

  const totalIncome = pdfIncome.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  
  const needsTotal = expenses.filter(t => t.type === 'needs').reduce((s, t) => s + t.amount, 0);
  const wantsTotal = expenses.filter(t => t.type === 'wants').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Ending balance: last transaction's balance on the last day of the month
  // transactions is sorted descending by date; same-day txns keep original (chronological) order
  const withBalance = transactions.filter(t => t.balance !== undefined);
  let endingBalance = 0;
  if (withBalance.length > 0) {
    const lastDate = withBalance[0].date;
    const lastDayTxns = withBalance.filter(t => t.date === lastDate);
    endingBalance = lastDayTxns[lastDayTxns.length - 1].balance ?? 0;
  }

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
      type: cat.type,
      amt: parseFloat((byCat[cat.id]?.amt ?? 0).toFixed(2)),
      txns: byCat[cat.id]?.txns ?? 0,
      trend: 0,
    })).filter(c => c.txns > 0);

  return {
    month,
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpenses: parseFloat(totalExpenses.toFixed(2)),
    needsTotal: parseFloat(needsTotal.toFixed(2)),
    wantsTotal: parseFloat(wantsTotal.toFixed(2)),
    savingsRate: parseFloat(savingsRate.toFixed(2)),
    endingBalance: parseFloat(endingBalance.toFixed(2)),
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

  return daily.map(v => parseFloat(v.toFixed(2)));
}

export function getSpendingLeaks(userId: string, month: string) {
  const { items: transactions } = db.findTransactionsByUser(userId, { month, limit: 9999 });
  const expenses = transactions.filter(t => t.type !== 'income');
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
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
        detail: `Spent ฿${spent.toFixed(2)} vs budget ฿${budget.toFixed(2)}`,
        detailEn: `Spent ฿${spent.toFixed(2)} — budget ฿${budget.toFixed(2)}`,
        amt: parseFloat(spent.toFixed(2)),
        over: parseFloat(over.toFixed(2)),
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
