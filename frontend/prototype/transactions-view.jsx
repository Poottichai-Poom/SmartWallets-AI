// Transactions CRUD view + add/edit modal.
// Used inside the Dashboard step. Operates on ctx.txns / ctx.addTxn / updateTxn / deleteTxn.

const TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function fmtDateTH(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
}
function fmtDateLong(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function TransactionsView({ ctx }) {
  const { txns, addTxn, updateTxn, deleteTxn, categories } = ctx;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | needs | wants
  const [catFilter, setCatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [editing, setEditing] = useState(null); // null | 'new' | txnId
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    let list = [...txns];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(t => t.merchant.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (catFilter !== 'all')  list = list.filter(t => t.catId === catFilter);

    list.sort((a, b) => {
      let cmp;
      if (sortBy === 'date')   cmp = a.date.localeCompare(b.date);
      else if (sortBy === 'amount') cmp = a.amount - b.amount;
      else cmp = a.merchant.localeCompare(b.merchant);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [txns, query, typeFilter, catFilter, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  function toggleSelect(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  }
  function bulkDelete() {
    selected.forEach(id => deleteTxn(id));
    setSelected(new Set());
  }

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', alignItems: 'flex-end' }}>
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name="file" size={14} className="text-mint"/>
            รายการธุรกรรม · Transactions
          </div>
          <div className="card-sub">
            จัดการเอง — เพิ่ม แก้ไข ลบ ได้ทั้งหมด · {filtered.length} รายการ · รวม <b className="mono text-2">฿{total.toLocaleString()}</b>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {selected.size > 0 && (
            <button className="btn btn-sm" onClick={bulkDelete} style={{ borderColor: 'var(--leak-line)', color: 'var(--leak)' }}>
              <Icon name="x" size={12} stroke={2.4}/> ลบ {selected.size} รายการ
            </button>
          )}
          <button className="btn btn-sm btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={12} stroke={3}/> เพิ่มรายการ · Add transaction
          </button>
        </div>
      </div>

      {/* filter strip */}
      <div className="row" style={{ padding: '12px 22px', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="search-wrap">
          <Icon name="filter" size={12} style={{ color: 'var(--text-3)' }}/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาผู้ขายหรือบันทึก…"
            className="search-input"
          />
        </div>
        <div className="seg" style={{ padding: 2 }}>
          {['all', 'needs', 'wants'].map(t => (
            <button key={t} className={`seg-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)} style={{ padding: '5px 10px', fontSize: 11 }}>
              {t === 'all' ? 'ทั้งหมด' : t === 'needs' ? 'จำเป็น' : 'ตามใจ'}
            </button>
          ))}
        </div>
        <select className="cat-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="all">หมวดหมู่ทั้งหมด · All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.th} · {c.en}</option>)}
        </select>
        <div className="grow"/>
        <div className="text-xs text-3 mono">{filtered.length} / {txns.length} รายการ</div>
      </div>

      {/* table */}
      <div style={{ maxHeight: 480, overflow: 'auto' }}>
        <table className="txn-table">
          <thead>
            <tr>
              <th style={{ width: 32, paddingLeft: 22 }}>
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="txn-check"/>
              </th>
              <th style={{ width: 100 }} onClick={() => toggleSort('date')} className="sortable">
                วันที่ · Date {sortBy === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => toggleSort('merchant')} className="sortable">
                ผู้ขาย · Merchant {sortBy === 'merchant' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ width: 180 }}>หมวด · Category</th>
              <th style={{ width: 100 }}>ประเภท · Type</th>
              <th style={{ width: 140, textAlign: 'right' }} onClick={() => toggleSort('amount')} className="sortable">
                จำนวน · Amount {sortBy === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ width: 88, textAlign: 'right', paddingRight: 22 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                ไม่พบรายการ — ปรับตัวกรองหรือเพิ่มรายการใหม่
              </td></tr>
            )}
            {filtered.map(t => {
              const cat = categories.find(c => c.id === t.catId);
              const color = t.type === 'needs' ? 'var(--needs)' : 'var(--wants)';
              return (
                <tr key={t.id} className={`txn-row ${selected.has(t.id) ? 'selected' : ''} ${t.manual ? 'manual' : ''}`}>
                  <td style={{ paddingLeft: 22 }}>
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="txn-check"/>
                  </td>
                  <td className="mono text-2 text-xs">{fmtDateTH(t.date)}</td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: t.manual ? 'var(--mint-glow)' : 'var(--surface-2)',
                        color: t.manual ? 'var(--mint)' : 'var(--text-2)',
                        border: t.manual ? '1px solid color-mix(in oklab, var(--mint) 30%, transparent)' : '1px solid var(--border-2)',
                        display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>{t.merchant.slice(0, 2).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-600 text-md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.merchant}
                          {t.manual && <span className="chip chip-mint" style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px' }}>MANUAL</span>}
                        </div>
                        {t.note && <div className="text-xs text-3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip" style={{ fontSize: 11 }}>
                      <span className="chip-dot" style={{ background: color }}/>{cat ? cat.th : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${t.type === 'needs' ? 'chip-needs' : 'chip-wants'}`} style={{ fontSize: 11 }}>
                      <span className="chip-dot"/>{t.type === 'needs' ? 'จำเป็น' : 'ตามใจ'}
                    </span>
                  </td>
                  <td className="mono fw-600" style={{ textAlign: 'right' }}>-฿{t.amount.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', paddingRight: 22 }}>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => setEditing(t.id)} title="แก้ไข">
                        <Icon name="settings" size={12}/>
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => { if (confirm('ลบรายการนี้?')) deleteTxn(t.id); }} title="ลบ">
                        <Icon name="x" size={12} stroke={2.4}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <TxnEditModal
          txn={editing === 'new' ? null : txns.find(t => t.id === editing)}
          categories={categories}
          onSave={(t) => {
            if (editing === 'new') addTxn(t);
            else updateTxn(editing, t);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => { deleteTxn(editing); setEditing(null); } : null}
        />
      )}

      <style>{`
        .search-wrap { display: flex; align-items: center; gap: 6px; background: var(--surface-2); border: 1px solid var(--border-2); border-radius: 8px; padding: 0 10px; min-width: 280px; }
        .search-input { flex: 1; background: transparent; border: 0; color: var(--text); font-family: inherit; font-size: 12px; padding: 7px 0; outline: 0; }
        .search-input::placeholder { color: var(--text-3); }
        .cat-select {
          background: var(--surface-2); border: 1px solid var(--border-2); color: var(--text);
          padding: 7px 28px 7px 12px; border-radius: 8px; font-family: inherit; font-size: 12px;
          appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--text-3) 50%), linear-gradient(135deg, var(--text-3) 50%, transparent 50%);
          background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
        }
        .txn-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .txn-table thead th {
          padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600;
          color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border); background: var(--bg-2);
          position: sticky; top: 0; z-index: 2;
        }
        .txn-table thead th.sortable { cursor: pointer; user-select: none; }
        .txn-table thead th.sortable:hover { color: var(--text-2); }
        .txn-row td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .txn-row:hover { background: var(--surface-2); }
        .txn-row:hover .row-actions { opacity: 1; }
        .txn-row.selected { background: var(--mint-soft); }
        .txn-row.manual td:first-child { box-shadow: inset 3px 0 0 var(--mint); }
        .row-actions { display: inline-flex; gap: 4px; opacity: 0; transition: opacity .15s ease; }
        .icon-btn {
          width: 26px; height: 26px; border-radius: 6px;
          background: var(--surface-2); border: 1px solid var(--border-2); color: var(--text-2);
          display: grid; place-items: center; cursor: pointer;
        }
        .icon-btn:hover { background: var(--surface-3); color: var(--text); }
        .icon-btn-danger:hover { background: var(--leak-bg); color: var(--leak); border-color: var(--leak-line); }
        .txn-check {
          appearance: none; width: 14px; height: 14px; border: 1.5px solid var(--border-3);
          border-radius: 4px; background: var(--surface-2); cursor: pointer; position: relative;
          margin: 0;
        }
        .txn-check:checked { background: var(--mint); border-color: var(--mint); }
        .txn-check:checked::after {
          content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px;
          border: solid #04140C; border-width: 0 2px 2px 0; transform: rotate(45deg);
        }
      `}</style>
    </div>
  );
}

/* ─────────────── Add / edit modal ─────────────── */
function TxnEditModal({ txn, categories, onSave, onClose, onDelete }) {
  const isNew = !txn;
  const [form, setForm] = useState(() => txn ? { ...txn } : {
    date: todayISO(),
    merchant: '',
    amount: '',
    catId: categories[0]?.id || 'misc',
    type: categories[0]?.type || 'needs',
    note: '',
    manual: true,
  });
  const [scanMode, setScanMode] = useState(false);

  function setCat(catId) {
    const cat = categories.find(c => c.id === catId);
    setForm(f => ({ ...f, catId, type: cat ? cat.type : f.type }));
  }

  function save() {
    if (!form.merchant || !form.amount) return;
    onSave({ ...form, amount: Math.round(Number(form.amount)), manual: true });
  }

  // simulate AI scan
  useEffect(() => {
    if (!scanMode) return;
    const t = setTimeout(() => {
      setForm({
        date: todayISO(),
        merchant: 'Café Amazon',
        amount: 145,
        catId: 'dining',
        type: 'wants',
        note: 'AI-extracted from receipt · CafeAmazon BKK',
        manual: true,
      });
      setScanMode(false);
    }, 2400);
    return () => clearTimeout(t);
  }, [scanMode]);

  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(7,9,15,0.72)', backdropFilter: 'blur(6px)',
      zIndex: 200, display: 'grid', placeItems: 'center', animation: 'fadeIn .15s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card appear" style={{ width: 520, padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="fw-700 text-lg">
              {isNew ? 'เพิ่มรายการใหม่' : 'แก้ไขรายการ'}
              <span className="text-3 fw-500 text-xs"> · {isNew ? 'New transaction' : 'Edit transaction'}</span>
            </div>
            <div className="text-xs text-3 mt-8">บันทึกค่าใช้จ่ายเอง — เช่น เงินสด เงินรับฝาก หรือรายการที่หายไป</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        {/* scan receipt option */}
        {isNew && (
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
            {!scanMode ? (
              <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--mint-soft)', borderColor: 'color-mix(in oklab, var(--mint) 30%, transparent)', color: 'var(--mint)' }} onClick={() => setScanMode(true)}>
                <Icon name="sparkle" size={13}/> สแกนใบเสร็จด้วย AI · Scan receipt with AI
              </button>
            ) : (
              <div className="row" style={{ gap: 12, padding: '6px 0' }}>
                <div className="spinner" style={{ width: 22, height: 22 }}/>
                <div>
                  <div className="text-md fw-600">กำลังอ่านใบเสร็จ…</div>
                  <div className="text-xs text-3">AI กำลังแยกผู้ขาย จำนวนเงิน และหมวดหมู่</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: 22 }}>
          {/* date + amount */}
          <div className="row" style={{ gap: 12 }}>
            <div style={{ flex: '0 0 150px' }}>
              <div className="form-label">วันที่ · Date</div>
              <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}/>
            </div>
            <div className="grow">
              <div className="form-label">จำนวนเงิน · Amount (฿)</div>
              <input type="number" className="form-input mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" autoFocus={isNew}/>
            </div>
          </div>
          <div className="row mt-8" style={{ gap: 6 }}>
            {quickAmounts.map(a => (
              <button key={a} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setForm({ ...form, amount: a })}>
                ฿{a}
              </button>
            ))}
          </div>

          {/* merchant */}
          <div className="mt-16">
            <div className="form-label">ผู้ขาย / รายละเอียด · Merchant</div>
            <input className="form-input" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="เช่น 7-Eleven, ค่าแท็กซี่, กาแฟ"/>
          </div>

          {/* category */}
          <div className="mt-16">
            <div className="form-label">หมวดหมู่ · Category</div>
            <div className="cat-grid">
              {categories.map(c => (
                <button key={c.id} className={`cat-pill ${form.catId === c.id ? 'active' : ''} ${c.type}`} onClick={() => setCat(c.id)}>
                  <span className="cat-pill-dot"/>
                  <span>
                    <span className="text-xs fw-600">{c.th}</span>
                    <span className="text-3 text-xs" style={{ display: 'block', fontSize: 10 }}>{c.en}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* type override */}
          <div className="mt-16">
            <div className="form-label">ประเภท · Type</div>
            <div className="row" style={{ gap: 8 }}>
              <button className={`type-btn ${form.type === 'needs' ? 'active needs' : ''}`} onClick={() => setForm({ ...form, type: 'needs' })}>
                <span className="chip-dot" style={{ background: 'var(--needs)' }}/>
                <BL th="จำเป็น" en="Needs"/>
              </button>
              <button className={`type-btn ${form.type === 'wants' ? 'active wants' : ''}`} onClick={() => setForm({ ...form, type: 'wants' })}>
                <span className="chip-dot" style={{ background: 'var(--wants)' }}/>
                <BL th="ตามใจ" en="Wants"/>
              </button>
            </div>
          </div>

          {/* note */}
          <div className="mt-16">
            <div className="form-label">บันทึก (ไม่บังคับ) · Note</div>
            <input className="form-input" value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เพิ่มรายละเอียด…"/>
          </div>
        </div>

        <div className="row between" style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          {onDelete ? (
            <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('ลบรายการนี้?')) onDelete(); }} style={{ color: 'var(--leak)' }}>
              <Icon name="x" size={12} stroke={2.4}/> ลบรายการ
            </button>
          ) : <div/>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={save} disabled={!form.merchant || !form.amount}>
              <Icon name="check" size={13} stroke={3}/> {isNew ? 'บันทึก · Save' : 'อัปเดต · Update'}
            </button>
          </div>
        </div>

        <style>{`
          .form-label { font-size: 11px; font-weight: 600; color: var(--text-3); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 6px; }
          .form-input {
            width: 100%; background: var(--surface-2); border: 1px solid var(--border-2);
            color: var(--text); padding: 10px 14px; border-radius: 9px;
            font-family: inherit; font-size: 14px; outline: 0;
            transition: border-color .15s, box-shadow .15s;
          }
          .form-input:focus { border-color: var(--mint); box-shadow: 0 0 0 3px var(--mint-soft); }
          .form-input.mono { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; }
          .cat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
          .cat-pill {
            appearance: none; cursor: pointer; font-family: inherit; color: inherit;
            background: var(--surface-2); border: 1px solid var(--border-2);
            border-radius: 9px; padding: 8px;
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            text-align: center;
          }
          .cat-pill .cat-pill-dot {
            width: 8px; height: 8px; border-radius: 50%;
          }
          .cat-pill.needs .cat-pill-dot { background: var(--needs); }
          .cat-pill.wants .cat-pill-dot { background: var(--wants); }
          .cat-pill:hover { border-color: var(--border-3); }
          .cat-pill.active.needs { border-color: var(--needs); background: var(--needs-bg); }
          .cat-pill.active.wants { border-color: var(--wants); background: var(--wants-bg); }
          .type-btn {
            flex: 1; appearance: none; cursor: pointer; font-family: inherit; color: inherit;
            background: var(--surface-2); border: 1px solid var(--border-2);
            border-radius: 10px; padding: 10px 14px;
            display: flex; align-items: center; gap: 10px;
          }
          .type-btn.active.needs { border-color: var(--needs); background: var(--needs-bg); }
          .type-btn.active.wants { border-color: var(--wants); background: var(--wants-bg); }
        `}</style>
      </div>
    </div>
  );
}

window.TransactionsView = TransactionsView;
window.TxnEditModal = TxnEditModal;
window.fmtDateTH = fmtDateTH;
