import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '../components/Layout/AppBar';
import KPICards from '../components/Dashboard/KPICards';
import DailyChart from '../components/Dashboard/DailyChart';
import CategoryList from '../components/Dashboard/CategoryList';
import LeaksPanel from '../components/Dashboard/LeaksPanel';
import TransactionList from '../components/Dashboard/TransactionList';
import type { MonthlySummary, SpendingLeak, IncomeSource, Transaction, AIRecommendation } from '../types/api';
import { analysisApi } from '../api/analysis';
import { transactionApi } from '../api/transaction';
import { incomeApi } from '../api/income';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [daily, setDaily] = useState<number[]>([]);
  const [leaks, setLeaks] = useState<SpendingLeak[]>([]);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, dailyRes, leaksRes, incomeRes, txnRes] = await Promise.all([
        analysisApi.summary(month),
        analysisApi.daily(month),
        analysisApi.leaks(month),
        incomeApi.list(),
        transactionApi.list({ month, limit: 50 }),
      ]);
      setSummary(sumRes.data);
      setDaily(dailyRes.data.daily);
      setLeaks(leaksRes.data.leaks);
      setIncome(incomeRes.data.incomeSources);
      setTransactions(txnRes.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function loadRecommendations() {
    setLoadingRecs(true);
    try {
      const res = await analysisApi.recommendations(month);
      setRecommendations(res.data.recommendations);
      setShowRecs(true);
    } finally {
      setLoadingRecs(false);
    }
  }

  // Generate month options (current + 5 previous)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <>
      <AppBar />
      <main className="page appear">
        {/* Header */}
        <div className="row between mb-16">
          <div>
            <p className="text-xs text-3 fw-600" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Dashboard & AI Analytics</p>
            <h1 style={{ marginTop: 4 }}>
              ภาพรวมการเงิน <span className="accent">{month}</span>
            </h1>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <select
              className="input"
              style={{ width: 'auto', padding: '7px 12px' }}
              value={month}
              onChange={e => setMonth(e.target.value)}
            >
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <Link to="/upload" className="btn btn-primary">
              + อัปโหลด PDF
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="row center" style={{ padding: '80px 0', gap: 12 }}>
            <span className="spinner" /> <span className="text-3">กำลังโหลด…</span>
          </div>
        ) : (
          <>
            {/* KPI row */}
            {summary && <KPICards summary={summary} income={income} />}

            {/* Charts row */}
            <div className="charts-row">
              <DailyChart daily={daily} month={month} />
              {summary && (
                <CategoryList categories={summary.categories} totalExpenses={summary.totalExpenses} />
              )}
            </div>

            {/* Leaks + Transactions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <LeaksPanel leaks={leaks} />
              <TransactionList transactions={transactions} onRefresh={fetchAll} />
            </div>

            {/* AI Recommendations */}
            <div className="card mt-16" style={{ padding: 20 }}>
              <div className="row between mb-16">
                <div className="fw-700">
                  คำแนะนำจาก AI · AI Recommendations
                  <span className="chip chip-mint" style={{ marginLeft: 10, fontSize: 10 }}>Gemini</span>
                </div>
                <button className="btn btn-sm" onClick={loadRecommendations} disabled={loadingRecs}>
                  {loadingRecs ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✨ วิเคราะห์'}
                </button>
              </div>
              {showRecs && recommendations.length === 0 && (
                <p className="text-3 text-sm">ไม่มีคำแนะนำ · Add income sources to get personalized recommendations</p>
              )}
              {recommendations.map(rec => (
                <div key={rec.id} className="row" style={{ gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                      background: rec.priority === 'high' ? 'var(--leak)' : rec.priority === 'medium' ? 'var(--wants)' : 'var(--text-3)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="fw-600" style={{ fontSize: 13 }}>{rec.title}</div>
                    <div className="text-sm text-3 mt-8">{rec.description}</div>
                    <div className="chip chip-mint mt-8" style={{ fontSize: 10 }}>
                      ประหยัดได้ ฿{Math.round(rec.potentialSaving).toLocaleString()}/เดือน
                    </div>
                  </div>
                </div>
              ))}
              {!showRecs && (
                <p className="text-3 text-sm">คลิก "วิเคราะห์" เพื่อให้ AI แนะนำวิธีประหยัดเงิน</p>
              )}
            </div>

            {/* Income sources */}
            <div className="card mt-16" style={{ padding: 20 }}>
              <div className="fw-700 mb-16">แหล่งรายได้ · Income Sources</div>
              {income.length === 0 ? (
                <p className="text-3 text-sm">ยังไม่มีรายได้ · <Link to="/income" className="text-mint">เพิ่มรายได้</Link></p>
              ) : (
                income.map(src => (
                  <div key={src.id} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div className="fw-600">{src.nameEn}</div>
                      <div className="text-xs text-3">วันที่ {src.dayOfMonth} ของเดือน · {src.type}</div>
                    </div>
                    <span className="mono fw-600" style={{ color: 'var(--mint)' }}>+฿{src.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
