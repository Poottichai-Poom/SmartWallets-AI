import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '../components/Layout/AppBar';
import KPICards from '../components/Dashboard/KPICards';
import DailyChart from '../components/Dashboard/DailyChart';
import LeaksPanel from '../components/Dashboard/LeaksPanel';
import TransactionList from '../components/Dashboard/TransactionList';
import type { MonthlySummary, Transaction } from '../types/api';
import { analysisApi } from '../api/analysis';
import { transactionApi } from '../api/transaction';

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [daily, setDaily] = useState<number[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string>('');
const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, dailyRes, txnRes] = await Promise.all([
        analysisApi.summary(month),
        analysisApi.daily(month),
        transactionApi.list({ month, limit: 9999 }),
      ]);
      setSummary(sumRes.data);
      setDaily(dailyRes.data.daily);
      setTransactions(txnRes.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function loadRecommendations() {
    setAnalysis('');
    setAnalysisError('');
    setShowRecs(false);
    setLoadingRecs(true);
    try {
      const recRes = await analysisApi.recommendations(month);
      setAnalysis(recRes.data.analysis);
      setShowRecs(true);
    } catch (err: any) {
      setAnalysisError(err?.response?.data?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
            {summary && <KPICards summary={summary} />}

            {/* Daily chart full width */}
            <div style={{ marginTop: 14 }}>
              <DailyChart daily={daily} month={month} />
            </div>

            {/* Spending breakdown — current */}
            {summary && (
              <div style={{ marginTop: 14 }}>
                <LeaksPanel view="current" categories={summary.categories} totalExpenses={summary.totalExpenses} totalIncome={summary.totalIncome} />
              </div>
            )}

            {/* Transactions */}
            <div style={{ marginTop: 14 }}>
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
              {loadingRecs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)', fontSize: 13 }}>
                    <span className="spinner" style={{ width: 16, height: 16, flexShrink: 0, borderColor: 'var(--mint)', borderTopColor: 'transparent' }} />
                    <span>AI กำลังวิเคราะห์การใช้เงินของคุณ…</span>
                  </div>
                  {(['90%', '75%', '55%'] as const).map((w, i) => (
                    <div key={w} style={{
                      height: 12, borderRadius: 6, width: w,
                      background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--border-2) 50%, var(--surface-2) 75%)',
                      backgroundSize: '200% 100%',
                      animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              ) : analysisError ? (
                <p className="text-sm" style={{ color: 'var(--leak)' }}>{analysisError}</p>
              ) : showRecs && analysis ? (
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-2)' }}>{analysis}</p>
              ) : (
                <p className="text-3 text-sm">คลิก "วิเคราะห์" เพื่อให้ AI วิเคราะห์การใช้เงินของคุณ</p>
              )}
            </div>


          </>
        )}
      </main>
    </>
  );
}
