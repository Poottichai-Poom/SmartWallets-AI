import { useState } from 'react';
import type { Transaction } from '../../types/api';
import { transactionApi } from '../../api/transaction';

interface Props {
  transactions: Transaction[];
  onRefresh: () => void;
}

function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }

export default function TransactionList({ transactions, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return;
    setDeleting(id);
    try {
      await transactionApi.delete(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between mb-16">
        <div className="fw-700">รายการล่าสุด · Recent Transactions</div>
        <span className="text-xs text-3">{transactions.length} รายการ</span>
      </div>
      {transactions.length === 0 && (
        <p className="text-3 text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
          ยังไม่มีรายการ · Upload a PDF statement to get started
        </p>
      )}
      {transactions.slice(0, 20).map((t) => (
        <div key={t.id} className="txn-row">
          <div className="txn-avatar">{t.merchant.slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.merchant}
            </div>
            <div className="text-xs text-3">{t.date.slice(0, 10)}</div>
          </div>
          <span className={`chip ${t.type === 'needs' ? 'chip-needs' : t.type === 'wants' ? 'chip-wants' : 'chip-mint'}`} style={{ fontSize: 10 }}>
            <span className="chip-dot" />
            {t.type === 'needs' ? 'จำเป็น' : t.type === 'wants' ? 'ตามใจ' : 'รายได้'}
          </span>
          <span className="mono fw-600" style={{ width: 80, textAlign: 'right', flexShrink: 0, color: t.type === 'income' ? 'var(--mint)' : 'inherit' }}>
            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
          </span>
          {t.manual && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '3px 7px', fontSize: 11 }}
              onClick={() => handleDelete(t.id)}
              disabled={deleting === t.id}
            >
              {deleting === t.id ? '…' : '✕'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
