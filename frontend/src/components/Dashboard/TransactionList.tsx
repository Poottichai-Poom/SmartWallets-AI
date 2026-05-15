import { useState } from 'react';
import type { Transaction } from '../../types/api';
import { transactionApi } from '../../api/transaction';

interface Props {
  transactions: Transaction[];
  onRefresh: () => void;
}

const CATEGORIES = [
  { id: 'rent',     th: 'ที่อยู่อาศัย', type: 'needs' as const },
  { id: 'food',     th: 'อาหาร',        type: 'needs' as const },
  { id: 'commute',  th: 'การเดินทาง',   type: 'needs' as const },
  { id: 'utility',  th: 'สาธารณูปโภค', type: 'needs' as const },
  { id: 'health',   th: 'สุขภาพ',       type: 'needs' as const },
  { id: 'dining',   th: 'ร้านอาหาร',    type: 'wants' as const },
  { id: 'shopping', th: 'ช้อปปิ้ง',     type: 'wants' as const },
  { id: 'fun',      th: 'บันเทิง',      type: 'wants' as const },
  { id: 'subs',     th: 'สมัครสมาชิก',  type: 'wants' as const },
  { id: 'misc',     th: 'อื่นๆ',        type: 'wants' as const },
  { id: 'income',   th: 'รายได้',       type: 'income' as const },
  { id: 'Transfer money to myself', th: 'โอนเงินให้ตัวเอง', type: 'wants' as const },
];

function fmt(n: number) { return '฿' + Math.round(n).toLocaleString('en-US'); }

function TxnItem({
  t,
  onDelete,
  onCatChange,
  deleting,
  saving,
}: {
  t: Transaction;
  onDelete: (id: string) => void;
  onCatChange: (id: string, catId: string, type: Transaction['type']) => void;
  deleting: string | null;
  saving: string | null;
}) {
  return (
    <div className="txn-row">
      <div className="txn-avatar">{t.merchant.slice(0, 2).toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fw-600" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.merchant}
        </div>
        <div className="text-xs text-3">{t.date.slice(0, 10)}</div>
      </div>

      {/* Category selector */}
      <select
        className="input"
        style={{ padding: '2px 6px', fontSize: 11, width: 'auto', minWidth: 80, height: 26, cursor: 'pointer' }}
        value={t.catId}
        disabled={saving === t.id}
        onChange={e => {
          const cat = CATEGORIES.find(c => c.id === e.target.value);
          if (cat) onCatChange(t.id, cat.id, cat.type);
        }}
      >
        {CATEGORIES.map(c => (
          <option key={c.id} value={c.id}>{c.th}</option>
        ))}
      </select>

      <span className="mono fw-600" style={{ width: 80, textAlign: 'right', flexShrink: 0, color: t.type === 'income' ? 'var(--mint)' : 'inherit' }}>
        {saving === t.id
          ? <span className="spinner" style={{ width: 12, height: 12, display: 'inline-block' }} />
          : <>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</>
        }
      </span>

      {t.manual && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '3px 7px', fontSize: 11 }}
          onClick={() => onDelete(t.id)}
          disabled={deleting === t.id}
        >
          {deleting === t.id ? '…' : '✕'}
        </button>
      )}
    </div>
  );
}

export default function TransactionList({ transactions, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

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

  async function handleCatChange(id: string, catId: string, type: Transaction['type']) {
    setSaving(id);
    try {
      await transactionApi.update(id, { catId, type });
      onRefresh();
    } finally {
      setSaving(null);
    }
  }

  const resolvedType = (t: Transaction) =>
    CATEGORIES.find(c => c.id === t.catId)?.type ?? t.type;

  const income = transactions.filter(t => resolvedType(t) === 'income');
  const expenses = transactions.filter(t => resolvedType(t) !== 'income');

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between mb-16">
        <div className="fw-700">รายการทั้งหมด · All Transactions</div>
        <span className="text-xs text-3">{transactions.length} รายการ</span>
      </div>

      {transactions.length === 0 && (
        <p className="text-3 text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>
          ยังไม่มีรายการ · Upload a PDF statement to get started
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* รายรับ */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="fw-600" style={{ fontSize: 13, color: 'var(--mint)' }}>รายรับ · Income</span>
            <span className="text-xs text-3">{income.length} รายการ</span>
          </div>
          {income.length === 0 ? (
            <p className="text-xs text-3" style={{ padding: '12px 0' }}>ไม่มีรายรับ</p>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {income.map(t => (
                <TxnItem key={t.id} t={t} onDelete={handleDelete} onCatChange={handleCatChange} deleting={deleting} saving={saving} />
              ))}
            </div>
          )}
        </div>

        {/* รายจ่าย */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="fw-600" style={{ fontSize: 13, color: 'var(--leak)' }}>รายจ่าย · Expenses</span>
            <span className="text-xs text-3">{expenses.length} รายการ</span>
          </div>
          {expenses.length === 0 ? (
            <p className="text-xs text-3" style={{ padding: '12px 0' }}>ไม่มีรายจ่าย</p>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {expenses.map(t => (
                <TxnItem key={t.id} t={t} onDelete={handleDelete} onCatChange={handleCatChange} deleting={deleting} saving={saving} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
