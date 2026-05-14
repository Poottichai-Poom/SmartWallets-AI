import type { SpendingLeak } from '../../types/api';

interface Props { leaks: SpendingLeak[]; }

function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }

export default function LeaksPanel({ leaks }: Props) {
  if (leaks.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="fw-700 mb-16">
          จุดรั่วทางการเงิน · Financial Leaks
          <span className="chip chip-mint" style={{ marginLeft: 10, fontSize: 10 }}>AI</span>
        </div>
        <p className="text-3 text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
          ไม่พบจุดรั่ว · No leaks detected 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between mb-16">
        <div className="fw-700">
          จุดรั่วทางการเงิน · Financial Leaks
          <span className="chip chip-mint" style={{ marginLeft: 10, fontSize: 10 }}>AI</span>
        </div>
        <span className="chip chip-leak">{leaks.length} จุด</span>
      </div>
      {leaks.map((leak, i) => (
        <div key={leak.id} className="leak-row" style={{ borderTop: i === 0 ? 'none' : undefined }}>
          <div
            className="leak-badge"
            style={{
              background: leak.severity === 'high' ? 'var(--leak-bg)' : leak.severity === 'medium' ? 'var(--wants-bg)' : 'var(--surface-2)',
              color: leak.severity === 'high' ? 'var(--leak)' : leak.severity === 'medium' ? 'var(--wants)' : 'var(--text-3)',
            }}
          >
            {leak.severity === 'high' ? '!' : leak.severity === 'medium' ? '▲' : '~'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600" style={{ fontSize: 13 }}>{leak.th}</div>
            <div className="text-xs text-3 mt-8">{leak.detailEn}</div>
            <div className="row mt-8" style={{ gap: 8 }}>
              <span className="chip chip-leak" style={{ fontSize: 10 }}>Over {fmt(leak.over)}</span>
              <span className="text-xs text-3">of {fmt(leak.amt)} total</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
