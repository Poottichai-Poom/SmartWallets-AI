import type { CategorySummary } from '../../types/api';

interface Props {
  categories: CategorySummary[];
  totalExpenses: number;
}

function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }

export default function CategoryList({ categories, totalExpenses }: Props) {
  const sorted = [...categories].sort((a, b) => b.amt - a.amt);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="fw-700 mb-16">หมวดหมู่การใช้จ่าย · Categories</div>
      {sorted.length === 0 && (
        <p className="text-3 text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
          ยังไม่มีรายการ · No transactions yet
        </p>
      )}
      {sorted.map(cat => {
        const pct = totalExpenses > 0 ? (cat.amt / totalExpenses) * 100 : 0;
        return (
          <div key={cat.id} style={{ marginBottom: 14 }}>
            <div className="row between mb-8">
              <div className="row" style={{ gap: 8 }}>
                <span className={`chip ${cat.type === 'needs' ? 'chip-needs' : 'chip-wants'}`} style={{ fontSize: 10 }}>
                  <span className="chip-dot" />{cat.type === 'needs' ? 'จำเป็น' : 'ตามใจ'}
                </span>
                <span className="fw-600" style={{ fontSize: 13 }}>{cat.th}</span>
                <span className="text-3 text-xs">{cat.en}</span>
              </div>
              <span className="mono fw-600">{fmt(cat.amt)}</span>
            </div>
            <div className="bar">
              <div
                className={`bar-fill ${cat.type === 'needs' ? 'bar-needs' : 'bar-wants'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="text-xs text-3 mt-8">{cat.txns} รายการ · {pct.toFixed(1)}%</div>
          </div>
        );
      })}
    </div>
  );
}
