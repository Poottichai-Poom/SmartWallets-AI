import type { MonthlySummary } from '../../types/api';

interface Props {
  summary: MonthlySummary;
}

function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }
function fmtK(n: number) { return n >= 1000 ? '฿' + (n / 1000).toFixed(1) + 'k' : '฿' + Math.round(n); }

export default function KPICards({ summary }: Props) {
  const totalIncome = summary.totalIncome;
  const savingsAmt = totalIncome - summary.totalExpenses;
  const needsPct = summary.totalExpenses > 0 ? Math.round(summary.needsTotal / summary.totalExpenses * 100) : 0;
  const wantsPct = summary.totalExpenses > 0 ? Math.round(summary.wantsTotal / summary.totalExpenses * 100) : 0;

  return (
    <div className="kpi-grid appear">
      <div className="kpi-card">
        <div className="kpi-label">รายจ่ายเดือนนี้ · Total Spend</div>
        <div className="kpi-value mono">{fmt(summary.totalExpenses)}</div>
        <div className="kpi-sub">รายได้ {fmtK(totalIncome)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">จำเป็น / ตามใจ · Needs / Wants</div>
        <div className="kpi-value" style={{ fontSize: 20 }}>
          <span style={{ color: 'var(--needs)' }}>{needsPct}%</span>
          {' / '}
          <span style={{ color: 'var(--wants)' }}>{wantsPct}%</span>
        </div>
        <div className="kpi-sub">{fmtK(summary.needsTotal)} / {fmtK(summary.wantsTotal)}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">อัตราการออม · Savings Rate</div>
        <div className="kpi-value mono" style={{ color: summary.savingsRate >= 20 ? 'var(--mint)' : 'var(--leak)' }}>
          {summary.savingsRate.toFixed(1)}%
        </div>
        <div className="kpi-sub">เป้า 20% {summary.savingsRate >= 20 ? '· บรรลุ ✓' : '· ต่ำกว่าเป้า'}</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">เงินคงเหลือ · Ending Balance</div>
        <div className="kpi-value mono" style={{ color: summary.endingBalance >= 0 ? 'var(--mint)' : 'var(--leak)' }}>
          {fmt(summary.endingBalance)}
        </div>
        <div className="kpi-sub">ณ สิ้นเดือน · End of statement</div>
      </div>
    </div>
  );
}
