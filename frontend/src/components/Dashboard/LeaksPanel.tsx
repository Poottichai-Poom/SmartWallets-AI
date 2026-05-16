import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategorySummary, AllocationItem } from '../../types/api';

interface Props {
  categories: CategorySummary[];
  totalExpenses: number;
  totalIncome: number;
  view: 'current' | 'recommended';
  allocations?: AllocationItem[];
}

const CAT_COLORS: Record<string, string> = {
  rent:     '#6366f1',
  food:     '#22c55e',
  commute:  '#3b82f6',
  utility:  '#f59e0b',
  health:   '#ec4899',
  dining:   '#ef4444',
  shopping: '#8b5cf6',
  fun:      '#f97316',
  subs:     '#06b6d4',
  misc:     '#94a3b8',
  savings:  '#10b981',
};


function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }

function DonutCenter({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', pointerEvents: 'none',
    }}>
      <div className="text-xs text-3" style={{ whiteSpace: 'nowrap' }}>{label}</div>
      <div className="fw-700 mono" style={{ fontSize: 12 }}>{value}</div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div className="fw-600">{d.th} · {d.en}</div>
      <div className="mono mt-8">{fmt(d.amt)}</div>
      {d.pct !== undefined && (
        <div className="text-xs text-3">เป้าหมาย {d.pct}% ของรายรับ</div>
      )}
    </div>
  );
}

export default function LeaksPanel({ categories, totalExpenses, totalIncome, view, allocations }: Props) {
  const currentData = categories
    .filter(c => c.amt > 0)
    .map(c => ({ ...c, fill: CAT_COLORS[c.id] ?? '#94a3b8' }));

  const recData = (allocations ?? [])
    .filter(a => a.amt > 0)
    .map(a => ({ ...a, fill: CAT_COLORS[a.id] ?? '#94a3b8' }));

  const compRows = (allocations ?? [])
    .filter(a => a.id !== 'savings')
    .map(a => {
      const cur = currentData.find(c => c.id === a.id);
      return { id: a.id, th: a.th, curAmt: cur?.amt ?? 0, recAmt: a.amt, diff: (cur?.amt ?? 0) - a.amt };
    });

  if (view === 'current') {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="fw-700 mb-16">สัดส่วนการใช้จ่าย · Spending Breakdown</div>
        {currentData.length === 0 ? (
          <p className="text-3 text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
            ยังไม่มีรายการ · No transactions yet
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={currentData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={2} dataKey="amt" />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenter label="รวมจ่าย" value={fmt(totalExpenses)} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...currentData].sort((a, b) => b.amt - a.amt).map(c => {
                const pct = totalExpenses > 0 ? Math.round((c.amt / totalExpenses) * 100) : 0;
                const color = CAT_COLORS[c.id] ?? '#94a3b8';
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.th}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span className="mono fw-600" style={{ fontSize: 12 }}>{fmt(c.amt)}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width .4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between mb-16">
        <div className="fw-700">การแบ่งเงินที่แนะนำ · Recommended Allocation</div>
      </div>

      {totalIncome === 0 ? (
        <p className="text-xs text-3" style={{ textAlign: 'center', padding: '40px 0' }}>
          เพิ่มรายรับเพื่อดูการแนะนำ
        </p>
      ) : (
        <>
          <div style={{ position: 'relative', width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={recData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={2} dataKey="amt" />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <DonutCenter label="รายรับ" value={fmt(totalIncome)} />
          </div>

          <div style={{ margin: '12px 0', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '5px 12px', alignItems: 'center' }}>
            {recData.map(c => {
              const total = recData.reduce((s, x) => s + x.amt, 0);
              const pct = total > 0 ? Math.round((c.amt / total) * 100) : 0;
              return (
                <>
                  <div key={c.id + '-n'} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[c.id] ?? '#94a3b8', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.th}</span>
                  </div>
                  <span key={c.id + '-a'} className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{fmt(c.amt)}</span>
                  <span key={c.id + '-p'} className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--text-3)' }}>{pct}%</span>
                </>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="text-xs fw-600 mb-8" style={{ color: 'var(--text-3)' }}>เปรียบเทียบ · Comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '6px 12px', alignItems: 'center' }}>
              <span className="text-xs text-3 fw-600">หมวดหมู่</span>
              <span className="text-xs text-3 fw-600" style={{ textAlign: 'right' }}>ปัจจุบัน</span>
              <span className="text-xs text-3 fw-600" style={{ textAlign: 'right' }}>แนะนำ</span>
              <span className="text-xs text-3 fw-600" style={{ textAlign: 'right' }}>ส่วนต่าง</span>
              {compRows.map(row => (
                <>
                  <div key={row.id + '-n'} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 1, background: CAT_COLORS[row.id] ?? '#94a3b8', flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{row.th}</span>
                  </div>
                  <span key={row.id + '-c'} className="mono" style={{ fontSize: 12, textAlign: 'right' }}>{fmt(row.curAmt)}</span>
                  <span key={row.id + '-r'} className="mono" style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-3)' }}>{fmt(row.recAmt)}</span>
                  <span key={row.id + '-d'} className="mono" style={{ fontSize: 12, textAlign: 'right', color: row.diff > 0 ? 'var(--leak)' : 'var(--mint)' }}>
                    {row.diff > 0 ? '+' : ''}{fmt(row.diff)}
                  </span>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
