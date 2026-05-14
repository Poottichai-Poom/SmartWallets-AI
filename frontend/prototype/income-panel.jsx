// Cash Flow header + Income Sources CRUD card.

/* ─────────────── Cash Flow strip — top of dashboard ─────────────── */
function CashFlowStrip({ ctx }) {
  const { totalIncome, monthSpend, incomes } = ctx;
  const net = totalIncome - monthSpend;
  const netRate = totalIncome > 0 ? net / totalIncome : 0;
  const spentPct = totalIncome > 0 ? Math.min(100, monthSpend / totalIncome * 100) : 0;
  const savedPct = Math.max(0, 100 - spentPct);
  const negative = net < 0;

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, color-mix(in oklab, var(--mint) 8%, var(--surface)) 0%, var(--surface) 60%)',
      borderColor: 'color-mix(in oklab, var(--mint) 22%, var(--border-2))',
      padding: 22, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 18, position: 'relative' }}>
        <div>
          <span className="eyebrow">CASH FLOW · กระแสเงินสด</span>
          <div className="card-sub mt-8">เดือนพฤษภาคม 2026 · {incomes.length} แหล่งรายได้</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`chip ${negative ? 'chip-leak' : 'chip-mint'}`}>
            <Icon name={negative ? 'arrowDown' : 'arrowUp'} size={11}/>
            {negative ? 'รายจ่ายเกินรายได้' : `ออม ${(netRate * 100).toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28, position: 'relative' }}>
        <CashCell
          label="รายได้รวม" labelEn="INCOME"
          value={totalIncome} color="var(--mint)"
          icon="arrowDown" arrowDir="in"
          sub={incomes.length === 1 ? '1 แหล่ง · 1 source' : `${incomes.length} แหล่ง · ${incomes.length} sources`}
        />
        <CashCell
          label="รายจ่ายรวม" labelEn="OUTCOME"
          value={monthSpend} color="var(--leak)"
          icon="arrowUp" arrowDir="out"
          sub={`${spentPct.toFixed(0)}% ของรายได้`}
        />
        <CashCell
          label="คงเหลือ · ออม" labelEn="NET CASH FLOW"
          value={net} color={negative ? 'var(--leak)' : 'var(--savings)'}
          icon="coins"
          sub={negative ? 'ติดลบ · adjust budget' : `พร้อมออม ${(netRate * 100).toFixed(0)}%`}
          showSign
        />
      </div>

      {/* income → outcome flow bar */}
      <div style={{ marginTop: 22, position: 'relative' }}>
        <div className="row between mb-8" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
          <span>฿0</span>
          <span style={{ flex: 1, textAlign: 'center', color: 'var(--text-2)' }}>
            <Icon name="arrowRight" size={10} style={{ verticalAlign: '-1px', marginRight: 4 }}/>
            FLOW
          </span>
          <span>฿{totalIncome.toLocaleString()}</span>
        </div>
        <div style={{
          height: 28, borderRadius: 8, overflow: 'hidden',
          display: 'flex', background: 'var(--surface-3)', position: 'relative',
          border: '1px solid var(--border-2)',
        }}>
          <div style={{ width: `${spentPct}%`, background: 'linear-gradient(90deg, var(--leak), color-mix(in oklab, var(--leak) 70%, var(--wants)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            {spentPct > 18 && `SPENT ฿${(monthSpend / 1000).toFixed(1)}k · ${spentPct.toFixed(0)}%`}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint)', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {savedPct > 12 && `LEFT ฿${Math.max(0, net / 1000).toFixed(1)}k · ${savedPct.toFixed(0)}%`}
          </div>
        </div>
        <div className="row between mt-8" style={{ fontSize: 10, color: 'var(--text-3)' }}>
          <span><span className="chip-dot" style={{ background: 'var(--leak)', display: 'inline-block', marginRight: 4 }}/>ใช้จ่าย · spent</span>
          <span><span className="chip-dot" style={{ background: 'var(--mint)', display: 'inline-block', marginRight: 4 }}/>ออม · saved</span>
        </div>
      </div>
    </div>
  );
}

function CashCell({ label, labelEn, value, color, icon, sub, showSign }) {
  const sign = showSign && value > 0 ? '+' : '';
  return (
    <div>
      <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `color-mix(in oklab, ${color} 16%, transparent)`,
          color, display: 'grid', placeItems: 'center', flexShrink: 0,
          border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
        }}>
          <Icon name={icon} size={11}/>
        </div>
        <div className="text-xs text-3" style={{ fontWeight: 700, letterSpacing: '.06em' }}>{labelEn}</div>
      </div>
      <div className="text-xs text-3" style={{ marginBottom: 4 }}>{label}</div>
      <div className="figure" style={{ fontSize: 30, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {sign}฿{Math.round(value).toLocaleString()}
      </div>
      <div className="text-xs text-3 mt-8">{sub}</div>
    </div>
  );
}

/* ─────────────── Income Sources card ─────────────── */
function IncomeSourcesCard({ ctx }) {
  const { incomes, addIncome, updateIncome, deleteIncome, totalIncome } = ctx;
  const [editing, setEditing] = useState(null); // null | 'new' | incomeId
  const types = window.MOCK.incomeTypes;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name="coins" size={14} className="text-mint"/>
            แหล่งรายได้ · Income Sources
          </div>
          <div className="card-sub">{incomes.length} แหล่ง · รวม <b className="mono text-2">฿{totalIncome.toLocaleString()}</b>/เดือน</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={12} stroke={3}/> เพิ่ม
        </button>
      </div>

      <div style={{ padding: '4px 0' }}>
        {incomes.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            ยังไม่มีแหล่งรายได้ — กด <b className="text-mint">เพิ่ม</b> เพื่อเริ่ม
          </div>
        )}
        {incomes.map((inc, i) => {
          const meta = types[inc.type] || types.other;
          return (
            <div key={inc.id} className="income-row" style={{
              padding: '12px 22px', borderTop: i === 0 ? 0 : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
                color: meta.color, display: 'grid', placeItems: 'center', flexShrink: 0,
                border: `1px solid color-mix(in oklab, ${meta.color} 30%, transparent)`,
              }}>
                <Icon name={meta.icon} size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between">
                  <div className="text-md fw-700" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.th}
                    {inc.manual && <span className="chip chip-mint" style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px' }}>MANUAL</span>}
                  </div>
                  <div className="figure fw-700 mono" style={{ color: meta.color, fontSize: 15 }}>
                    +฿{inc.amount.toLocaleString()}
                  </div>
                </div>
                <div className="row between" style={{ marginTop: 2 }}>
                  <div className="text-xs text-3">{inc.en} · {meta.th}</div>
                  <div className="text-xs text-3">ทุกวันที่ {inc.day || 1}</div>
                </div>
              </div>
              <div className="income-actions">
                <button className="icon-btn" onClick={() => setEditing(inc.id)}><Icon name="settings" size={12}/></button>
                <button className="icon-btn icon-btn-danger" onClick={() => { if (confirm('ลบแหล่งรายได้นี้?')) deleteIncome(inc.id); }}>
                  <Icon name="x" size={12} stroke={2.4}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-xs text-3">รายได้รวมต่อเดือน · Total monthly</span>
        <span className="figure fw-700 mono text-mint" style={{ fontSize: 18 }}>฿{totalIncome.toLocaleString()}</span>
      </div>

      <style>{`
        .income-row:hover { background: var(--surface-2); }
        .income-row:hover .income-actions { opacity: 1; }
        .income-actions { display: inline-flex; gap: 4px; opacity: 0; transition: opacity .15s ease; }
      `}</style>

      {editing && (
        <IncomeEditModal
          income={editing === 'new' ? null : incomes.find(i => i.id === editing)}
          onSave={(data) => {
            if (editing === 'new') addIncome(data);
            else updateIncome(editing, data);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => { deleteIncome(editing); setEditing(null); } : null}
        />
      )}
    </div>
  );
}

/* ─────────────── Income add/edit modal ─────────────── */
function IncomeEditModal({ income, onSave, onClose, onDelete }) {
  const isNew = !income;
  const [form, setForm] = useState(() => income ? { ...income } : {
    th: '',
    en: '',
    amount: '',
    type: 'salary',
    day: 25,
  });
  const types = window.MOCK.incomeTypes;
  const quickAmounts = [10000, 20000, 30000, 50000, 100000];

  function save() {
    if (!form.th || !form.amount) return;
    onSave({ ...form, amount: Math.round(+form.amount), manual: true });
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(7,9,15,0.72)', backdropFilter: 'blur(6px)',
      zIndex: 200, display: 'grid', placeItems: 'center', animation: 'fadeIn .15s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card appear" style={{ width: 500, padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="fw-700 text-lg">
              {isNew ? 'เพิ่มแหล่งรายได้' : 'แก้ไขแหล่งรายได้'}
              <span className="text-3 fw-500 text-xs"> · {isNew ? 'New income' : 'Edit income'}</span>
            </div>
            <div className="text-xs text-3 mt-8">เช่น เงินเดือน, ฟรีแลนซ์, ลงทุน, หรือรายได้เสริม</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div style={{ padding: 22 }}>
          {/* type pills */}
          <div>
            <div className="form-label">ประเภท · Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {Object.entries(types).map(([k, v]) => (
                <button key={k}
                  className={`income-type-pill ${form.type === k ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, type: k })}
                  style={{ '--c': v.color }}>
                  <Icon name={v.icon} size={14}/>
                  <span>{v.th}</span>
                </button>
              ))}
            </div>
          </div>

          {/* name */}
          <div className="mt-16">
            <div className="form-label">ชื่อแหล่งรายได้ · Source name</div>
            <input className="form-input" value={form.th} onChange={(e) => setForm({ ...form, th: e.target.value })} placeholder="เช่น เงินเดือน, ฟรีแลนซ์, หุ้นปันผล" autoFocus={isNew}/>
            <input className="form-input mt-8" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} placeholder="In English (optional)"/>
          </div>

          {/* amount + day */}
          <div className="row mt-16" style={{ gap: 12 }}>
            <div className="grow">
              <div className="form-label">จำนวนต่อเดือน · Monthly amount (฿)</div>
              <input type="number" className="form-input mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0"/>
            </div>
            <div style={{ flex: '0 0 130px' }}>
              <div className="form-label">วันที่รับ · Pay day</div>
              <input type="number" min="1" max="31" className="form-input mono" value={form.day} onChange={(e) => setForm({ ...form, day: Math.max(1, Math.min(31, +e.target.value || 1)) })}/>
            </div>
          </div>
          <div className="row mt-8" style={{ gap: 6 }}>
            {quickAmounts.map(a => (
              <button key={a} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setForm({ ...form, amount: a })}>
                ฿{(a / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        <div className="row between" style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {onDelete ? (
            <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('ลบแหล่งรายได้นี้?')) onDelete(); }} style={{ color: 'var(--leak)' }}>
              <Icon name="x" size={12} stroke={2.4}/> ลบ
            </button>
          ) : <div/>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={save} disabled={!form.th || !form.amount}>
              <Icon name="check" size={13} stroke={3}/> {isNew ? 'เพิ่ม' : 'บันทึก'}
            </button>
          </div>
        </div>

        <style>{`
          .income-type-pill {
            appearance: none; cursor: pointer; font-family: inherit; color: var(--text-2);
            background: var(--surface-2); border: 1px solid var(--border-2);
            border-radius: 9px; padding: 10px 6px;
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            font-size: 11px; font-weight: 600;
          }
          .income-type-pill:hover { border-color: var(--border-3); color: var(--text); }
          .income-type-pill.active {
            background: color-mix(in oklab, var(--c) 14%, var(--surface-2));
            border-color: var(--c);
            color: var(--c);
          }
        `}</style>
      </div>
    </div>
  );
}

Object.assign(window, { CashFlowStrip, IncomeSourcesCard, IncomeEditModal });
