// Step 1 — Data Ingestion. Two paths: Connect Bank API, or Upload PDF.
// NO manual entry forms. Includes PDF parsing animation.

function StepConnect({ ctx }) {
  const [mode, setMode] = useState(null); // null | 'bank' | 'pdf' | 'parsing' | 'manual' | 'done'
  const [selectedBank, setSelectedBank] = useState(null);
  const [authStage, setAuthStage] = useState(0); // 0=select, 1=consent, 2=connecting, 3=done

  function startBankAuth(bank) {
    setSelectedBank(bank);
    setMode('bank');
    setAuthStage(1);
  }
  function confirmConsent() {
    setAuthStage(2);
    setTimeout(() => { setAuthStage(3); ctx.onComplete(); }, 1800);
  }

  function startPdfParse() {
    setMode('parsing');
    // simulated; the component below handles its own progression
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

      {/* LEFT — hero + ingestion options */}
      <div>
        {mode === null && <IngestHero onPickBank={() => setMode('bank')} onPickPdf={() => setMode('pdf')} onPickManual={() => setMode('manual')} />}
        {mode === 'bank' && (
          <BankConnect
            stage={authStage}
            bank={selectedBank}
            onPick={startBankAuth}
            onConfirm={confirmConsent}
            onBack={() => { setMode(null); setAuthStage(0); }}
          />
        )}
        {mode === 'pdf' && <PdfUpload onStart={startPdfParse} onBack={() => setMode(null)} />}
        {mode === 'parsing' && <PdfParsing onDone={() => { setMode('done'); ctx.onComplete(); }} />}
        {mode === 'manual' && <ManualEntry ctx={ctx} onBack={() => setMode(null)} onDone={() => { setMode('done'); ctx.onComplete(); }} />}
        {mode === 'done' && <IngestionDone onContinue={ctx.onAdvance} />}
      </div>

      {/* RIGHT — sidebar: why no manual entry, trust strip */}
      <aside className="col" style={{ gap: 16, position: 'sticky', top: 80 }}>
        <NoManualCard />
        <SupportedSourcesCard />
        <TrustStripCompact />
      </aside>
    </div>
  );
}

/* ─────────────── Hero ─────────────── */
function IngestHero({ onPickBank, onPickPdf, onPickManual }) {
  return (
    <div className="appear">
      <span className="eyebrow">STEP 01 · DATA INGESTION</span>
      <h1 className="display mt-12">
        เลือกวิธี <span className="accent">นำข้อมูลการเงิน</span> ของคุณ
      </h1>
      <p className="lede">
        SmartWallets AI รองรับ 3 วิธี — เชื่อมต่อธนาคารอัตโนมัติ, อัปโหลด PDF สเตทเมนต์,
        หรือบันทึกเอง — เลือกสิ่งที่เหมาะกับไลฟ์สไตล์ของคุณ <span className="text-3">/ Three ways to track. Pick what fits you.</span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>
        {/* Bank API */}
        <button onClick={onPickBank} className="ingest-card ingest-primary">
          <div className="ingest-icon">
            <Icon name="bank" size={26}/>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="chip chip-mint mb-8"><span className="chip-dot"/>RECOMMENDED · เร็วที่สุด</div>
            <BL th="เชื่อมต่อ Banking API" en="Connect Banking API"/>
            <div className="text-sm text-2 mt-8" style={{ lineHeight: 1.55 }}>
              เชื่อมต่อบัญชีธนาคารผ่าน OAuth read-only — อัปเดตอัตโนมัติทุกวัน
            </div>
          </div>
          <div className="ingest-foot">
            <span className="text-xs text-3">~30 วินาที</span>
            <span className="text-xs text-mint fw-600">Auto-sync daily →</span>
          </div>
        </button>

        {/* PDF Upload */}
        <button onClick={onPickPdf} className="ingest-card">
          <div className="ingest-icon ingest-icon-2">
            <Icon name="file" size={26}/>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="chip mb-8"><span className="chip-dot" style={{ background: 'var(--text-3)'}}/>OFFLINE · ไม่ต้องเชื่อมต่อ</div>
            <BL th="อัปโหลด PDF สเตทเมนต์" en="Upload PDF Bank Statement"/>
            <div className="text-sm text-2 mt-8" style={{ lineHeight: 1.55 }}>
              ลากไฟล์ PDF เข้ามา — AI จะแยกรายการ จัดหมวด และจดจำผู้ขายให้
            </div>
          </div>
          <div className="ingest-foot">
            <span className="text-xs text-3">รองรับ 12+ ธนาคาร</span>
            <span className="text-xs text-mint fw-600">Parse with AI →</span>
          </div>
        </button>
      </div>

      {/* 3rd path — manual entry, full-width below */}
      <button onClick={onPickManual} className="ingest-card ingest-wide mt-16">
        <div className="row" style={{ gap: 18, alignItems: 'center' }}>
          <div className="ingest-icon ingest-icon-2" style={{ width: 56, height: 56 }}>
            <Icon name="plus" size={26} stroke={2.4}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <div className="chip" style={{ fontSize: 10 }}><span className="chip-dot" style={{ background: 'var(--text-3)' }}/>FLEXIBLE · ถอดออก / เงินสด</div>
              <div className="chip chip-mint" style={{ fontSize: 10 }}><Icon name="sparkle" size={9}/>AI Receipt Scan</div>
            </div>
            <BL th="บันทึกรายการเอง · เพิ่ม/แก้ไข/ลบได้" en="Add transactions manually · Add / Edit / Delete"/>
            <div className="text-sm text-2 mt-8" style={{ lineHeight: 1.55, maxWidth: 560 }}>
              เหมาะสำหรับเงินสด รายการที่ยังไม่มีในสเตทเมนต์ หรือแก้ไขรายการที่จัดหมวดผิด
              — สแกนใบเสร็จด้วย AI ได้ด้วย
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className="text-xs text-mint fw-600">Manual control →</span>
            <div className="text-xs text-3 mt-8">CRUD · full control</div>
          </div>
        </div>
      </button>

      <style>{`
        .ingest-card {
          appearance: none; text-align: left; cursor: pointer;
          background: var(--surface); border: 1px solid var(--border-2);
          border-radius: var(--radius-xl); padding: 22px;
          color: var(--text); font-family: inherit;
          display: flex; flex-direction: column;
          min-height: 220px;
          transition: all .2s ease;
          position: relative; overflow: hidden;
        }
        .ingest-wide { min-height: 0; }
        .ingest-card:hover { transform: translateY(-2px); border-color: var(--mint); background: var(--surface-2); }
        .ingest-primary { background: linear-gradient(160deg, color-mix(in oklab, var(--mint) 12%, var(--surface)) 0%, var(--surface) 60%); border-color: color-mix(in oklab, var(--mint) 30%, var(--border-2)); }
        .ingest-primary::after {
          content: ''; position: absolute; right: -40px; top: -40px; width: 180px; height: 180px;
          background: radial-gradient(circle, var(--mint-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .ingest-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--mint-glow); color: var(--mint);
          display: grid; place-items: center;
          border: 1px solid color-mix(in oklab, var(--mint) 35%, transparent);
        }
        .ingest-icon-2 { background: var(--surface-2); color: var(--text-2); border-color: var(--border-2); }
        .ingest-foot { margin-top: auto; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      {/* Why three ways — the philosophy banner */}
      <div className="card mt-24" style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--surface)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="sparkle" size={22}/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="fw-700 text-md">
            หลาย Solution — เพียงผู้ใช้ <span className="text-3 fw-600">/ Multiple solutions, one place.</span>
          </div>
          <div className="text-sm text-2 mt-8" style={{ lineHeight: 1.5 }}>
            ไม่ว่าคุณจะเชื่อมต่อธนาคาร, อัปสเตทเมนต์, หรือบันทึกเรื่องเงินสดเอง —
            SmartWallets ตอบโจทย์ได้ทุกรูปแบบ และคุณสลับระหว่างวิธีได้ตลอดเวลา
          </div>
        </div>
        <div className="col" style={{ gap: 6, paddingLeft: 18, borderLeft: '1px solid var(--border)', minWidth: 160 }}>
          <div className="row text-xs" style={{ gap: 6 }}><Icon name="check" size={11} className="text-mint" stroke={3}/><span>Banking API</span></div>
          <div className="row text-xs" style={{ gap: 6 }}><Icon name="check" size={11} className="text-mint" stroke={3}/><span>PDF Statement</span></div>
          <div className="row text-xs" style={{ gap: 6 }}><Icon name="check" size={11} className="text-mint" stroke={3}/><span>Manual Entry + AI</span></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Manual entry flow ─────────────── */
function ManualEntry({ ctx, onBack, onDone }) {
  const [editing, setEditing] = useState(false);
  const [added, setAdded] = useState([]);
  const { addTxn, categories } = ctx;

  function handleSave(t) {
    addTxn(t);
    setAdded(prev => [{ ...t, _displayId: Date.now() + Math.random() }, ...prev]);
    setEditing(false);
  }

  return (
    <div className="appear">
      <button className="btn btn-ghost btn-sm" onClick={onBack}>
        <Icon name="arrowLeft" size={14}/> เปลี่ยนวิธีนำเข้า
      </button>
      <h1 className="display mt-12" style={{ fontSize: 28 }}>
        บันทึกรายการของคุณ <span className="accent">ด้วยตัวเอง</span>
      </h1>
      <p className="text-2 text-sm mt-8">
        เพิ่มรายการทีละรายการ — เหมาะสำหรับเงินสด รายการที่สเตทเมนต์ไม่จับ หรือไว้ปรับแก้ไขภายหลัง
        · <span className="text-mint">สแกนใบเสร็จด้วย AI</span> ได้ด้วย
      </p>

      <div className="card mt-20" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 22, borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div className="row between">
            <div>
              <div className="fw-700 text-md">รายการที่เพิ่ม · Added so far</div>
              <div className="text-xs text-3 mt-8">{added.length} รายการ · รวม <b className="mono text-2">฿{added.reduce((s, t) => s + (+t.amount || 0), 0).toLocaleString()}</b></div>
            </div>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Icon name="plus" size={13} stroke={3}/> เพิ่มรายการ
            </button>
          </div>
        </div>

        {added.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 14, background: 'var(--surface-2)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', border: '1px dashed var(--border-3)' }}>
              <Icon name="plus" size={26}/>
            </div>
            <div className="fw-600 text-md mt-16">ยังไม่มีรายการ</div>
            <div className="text-xs text-3 mt-8">คลิก "เพิ่มรายการ" เพื่อเริ่มต้น</div>
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {added.map(t => {
              const cat = categories.find(c => c.id === t.catId);
              return (
                <div key={t._displayId} className="row between appear" style={{ padding: '12px 22px', borderTop: '1px solid var(--border)' }}>
                  <div className="row" style={{ gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11, border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)' }}>
                      {(t.merchant || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-md fw-600">{t.merchant}</div>
                      <div className="text-xs text-3">{cat?.th || '—'} · {t.date}</div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 12 }}>
                    <span className={`chip ${t.type === 'needs' ? 'chip-needs' : 'chip-wants'}`} style={{ fontSize: 10 }}>
                      <span className="chip-dot"/>{t.type === 'needs' ? 'จำเป็น' : 'ตามใจ'}
                    </span>
                    <div className="mono fw-600">-฿{(+t.amount).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-2)' }}>
          <div className="text-xs text-3">ҿ เพิ่มได้ไม่จำกัด · แก้ไข/ลบได้ตลอดเวลาจากแดชบอร์ด</div>
          <button className="btn btn-primary" onClick={onDone} disabled={added.length === 0}>
            ไปยังแดชบอร์ด · Continue <Icon name="arrowRight" size={13}/>
          </button>
        </div>
      </div>

      <div className="row mt-16" style={{ gap: 10, color: 'var(--text-3)', fontSize: 12 }}>
        <Icon name="info" size={14}/> รายการที่เพิ่มจะถูกรวมอยู่ในแดชบอร์ด และส่งผลต่อแผน 50/30/20 ของคุณทันที
      </div>

      {editing && (
        <TxnEditModal
          txn={null}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditing(false)}
          onDelete={null}
        />
      )}
    </div>
  );
}

/* ─────────────── Bank Connect flow ─────────────── */
const BANKS = [
  { id: 'scb',  name: 'SCB',         th: 'ไทยพาณิชย์',         color: '#5E2A87' },
  { id: 'kbnk', name: 'KBank',       th: 'กสิกรไทย',           color: '#0E9F6E' },
  { id: 'bbl',  name: 'Bangkok Bank',th: 'กรุงเทพ',            color: '#1F4FAA' },
  { id: 'ktb',  name: 'Krung Thai',  th: 'กรุงไทย',            color: '#00A8E1' },
  { id: 'bay',  name: 'Krungsri',    th: 'กรุงศรีฯ',           color: '#FCC400' },
  { id: 'ttb',  name: 'ttb',         th: 'ทหารไทยธนชาต',       color: '#1656A0' },
  { id: 'gsb',  name: 'GSB',         th: 'ออมสิน',             color: '#E91E63' },
  { id: 'uob',  name: 'UOB',         th: 'ยูโอบี',             color: '#003DA5' },
];

function BankConnect({ stage, bank, onPick, onConfirm, onBack }) {
  return (
    <div className="appear">
      <button className="btn btn-ghost btn-sm" onClick={onBack}>
        <Icon name="arrowLeft" size={14}/> เปลี่ยนวิธีนำเข้า
      </button>
      <h1 className="display mt-12" style={{ fontSize: 28 }}>
        {stage === 1 && <>อนุญาตการเข้าถึงแบบ <span className="accent">Read-Only</span></>}
        {stage === 2 && <>กำลังเชื่อมต่อกับ <span className="accent">{bank?.name}</span></>}
        {stage === 3 && <>เชื่อมต่อ <span className="accent">สำเร็จ</span></>}
        {!stage && <>เลือกธนาคารของคุณ</>}
      </h1>

      {(!stage) && (
        <>
          <p className="text-2 text-sm mt-8">รองรับธนาคารหลักในประเทศไทย — เชื่อมต่อผ่านระบบ Open Banking ที่ผ่านการรับรอง</p>
          <div className="card mt-20" style={{ padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {BANKS.map(b => (
                <button key={b.id} className="bank-logo" onClick={() => onPick(b)} style={{ height: 64 }}>
                  <span className="b-mark" style={{ background: b.color }}>{b.name[0]}</span>
                  <span style={{ display: 'inline-flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{b.th}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="text-xs text-3 mt-16 row" style={{ gap: 6 }}>
              <Icon name="info" size={12}/> ไม่เห็นธนาคารของคุณ? ใช้ตัวเลือก "อัปโหลด PDF" แทนได้
            </div>
          </div>
        </>
      )}

      {stage === 1 && bank && (
        <div className="card mt-20" style={{ padding: 0, overflow: 'hidden' }}>
          {/* fake bank consent screen */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', background: bank.color, color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{bank.name[0]}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{bank.name} <span style={{ opacity: .7, fontWeight: 500 }}>· {bank.th}</span></div>
              <div style={{ fontSize: 11, opacity: .85 }}>Open Banking Consent · เลขที่อ้างอิง #SW-48291</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, opacity: .9 }}>🔒 Secure</div>
          </div>

          <div style={{ padding: 22 }}>
            <div className="fw-700 text-md mb-8">SmartWallets AI ขออนุญาตเข้าถึง:</div>
            {[
              { th: 'ดูประวัติธุรกรรมย้อนหลัง 12 เดือน', en: 'Read transaction history (12 months)', granted: true },
              { th: 'ดูยอดคงเหลือบัญชี', en: 'Read account balance', granted: true },
              { th: 'ดูชื่อผู้ขายและหมวดหมู่', en: 'Read merchant & category metadata', granted: true },
              { th: 'โอนเงินหรือชำระบิล', en: 'Transfer money or pay bills', granted: false },
              { th: 'เปลี่ยนแปลงข้อมูลบัญชี', en: 'Modify account data', granted: false },
            ].map((p, i) => (
              <div key={i} className="row between" style={{ padding: '10px 0', borderTop: i === 0 ? 0 : '1px solid var(--border)' }}>
                <div className="row" style={{ gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: p.granted ? 'var(--mint-glow)' : 'var(--leak-bg)',
                    color: p.granted ? 'var(--mint)' : 'var(--leak)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name={p.granted ? 'check' : 'x'} size={12} stroke={3}/>
                  </div>
                  <div>
                    <div className="text-md">{p.th}</div>
                    <div className="text-xs text-3">{p.en}</div>
                  </div>
                </div>
                <div className={`text-xs fw-600 ${p.granted ? 'text-mint' : 'text-leak'}`}>
                  {p.granted ? 'อนุญาต' : 'ไม่อนุญาต'}
                </div>
              </div>
            ))}
            <div className="row mt-16" style={{ gap: 10 }}>
              <button className="btn btn-primary btn-lg grow" onClick={onConfirm}>
                <Icon name="lock" size={14}/> ยอมรับและเชื่อมต่อ · Authorize Read-Only
              </button>
              <button className="btn btn-lg" onClick={onBack}>ยกเลิก</button>
            </div>
            <div className="text-xs text-3 mt-12 row center" style={{ gap: 6 }}>
              <Icon name="shield" size={12}/> SmartWallets ไม่สามารถโอนเงิน เปลี่ยนรหัส หรือเข้าถึง PIN ของคุณได้
            </div>
          </div>
        </div>
      )}

      {stage === 2 && (
        <ConnectingPanel bank={bank}/>
      )}

      {stage === 3 && (
        <ConnectedSummary bank={bank} onContinue={() => {}}/>
      )}
    </div>
  );
}

function ConnectingPanel({ bank }) {
  const steps = [
    { th: 'ยืนยันตัวตน OAuth', en: 'OAuth handshake' },
    { th: 'ดึงรายการธุรกรรม 12 เดือน', en: 'Fetching 12 months of transactions' },
    { th: 'จัดหมวดด้วย AI', en: 'AI categorization' },
    { th: 'ตรวจหา Financial Leaks', en: 'Scanning for leaks' },
  ];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= steps.length) return;
    const id = setTimeout(() => setN(n + 1), 420);
    return () => clearTimeout(id);
  }, [n]);
  return (
    <div className="card mt-20" style={{ padding: 26 }}>
      <div className="row" style={{ gap: 14 }}>
        <div className="spinner"/>
        <div>
          <div className="fw-700">กำลังประมวลผล…</div>
          <div className="text-xs text-3">{bank?.name} · เชื่อมต่อแบบ Read-Only</div>
        </div>
      </div>
      <div className="mt-20 col" style={{ gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} className="row" style={{ gap: 10, opacity: i > n ? .35 : 1, transition: 'opacity .3s' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: i < n ? 'var(--mint-glow)' : 'var(--surface-2)',
              color: i < n ? 'var(--mint)' : 'var(--text-3)',
              display: 'grid', placeItems: 'center',
              border: `1px solid ${i < n ? 'var(--mint)' : 'var(--border-2)'}`,
            }}>
              {i < n ? <Icon name="check" size={12} stroke={3}/> : i === n ? <span className="dotdot"/> : <span style={{ fontSize: 10 }}>{i + 1}</span>}
            </div>
            <div className="text-md">{s.th}</div>
            <div className="text-xs text-3">/ {s.en}</div>
            {i === n && <span className="text-xs text-mint" style={{ marginLeft: 'auto' }}>processing…</span>}
            {i < n && <span className="text-xs text-mint" style={{ marginLeft: 'auto' }}>done</span>}
          </div>
        ))}
      </div>
      <style>{`
        .spinner { width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid var(--surface-3); border-top-color: var(--mint); animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dotdot { width: 5px; height: 5px; border-radius: 50%; background: var(--mint); animation: pulse 1s ease infinite; }
      `}</style>
    </div>
  );
}

function ConnectedSummary({ bank }) {
  return (
    <div className="card mt-20 appear" style={{ padding: 26, borderColor: 'var(--mint)', background: 'linear-gradient(180deg, var(--mint-soft), var(--surface) 60%)' }}>
      <div className="row" style={{ gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={24} stroke={3}/>
        </div>
        <div>
          <div className="fw-700 text-lg">เชื่อมต่อสำเร็จ · Connected</div>
          <div className="text-xs text-3">{bank?.name} · {bank?.th} · กำลังซิงค์อัตโนมัติทุกวัน</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 18 }}>
        {[
          ['487',   'ธุรกรรม', 'Transactions'],
          ['฿42,580', 'รายจ่ายเดือนนี้', 'This month'],
          ['12',    'หมวดหมู่', 'Categories'],
          ['5',     'จุดรั่วพบ', 'Leaks found'],
        ].map(([v, th, en], i) => (
          <div key={i} className="card card-tight" style={{ padding: 12 }}>
            <div className="figure figure-md text-mint">{v}</div>
            <div className="text-xs" style={{ marginTop: 4 }}>{th}</div>
            <div className="text-xs text-3">{en}</div>
          </div>
        ))}
      </div>
      <div className="text-sm text-2 mt-16 row" style={{ gap: 8 }}>
        <Icon name="sparkle" size={14} className="text-mint"/>
        AI พบ <b className="text-leak">฿4,180</b> ที่อาจประหยัดได้ — ดูได้ในแดชบอร์ดถัดไป
      </div>
    </div>
  );
}

/* ─────────────── PDF upload + parsing animation ─────────────── */
function PdfUpload({ onStart, onBack }) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="appear">
      <button className="btn btn-ghost btn-sm" onClick={onBack}>
        <Icon name="arrowLeft" size={14}/> เปลี่ยนวิธีนำเข้า
      </button>
      <h1 className="display mt-12" style={{ fontSize: 28 }}>
        อัปโหลด <span className="accent">PDF สเตทเมนต์</span>
      </h1>
      <p className="text-2 text-sm mt-8">ลากไฟล์เข้ามา — รองรับสเตทเมนต์จาก SCB, KBank, BBL, KTB และอื่นๆ ไฟล์ของคุณจะถูกประมวลผลในเครื่อง ไม่ถูกเก็บไว้บนเซิร์ฟเวอร์</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onStart(); }}
        onClick={onStart}
        className="card mt-20"
        style={{
          padding: '50px 28px',
          border: `1.5px dashed ${drag ? 'var(--mint)' : 'var(--border-3)'}`,
          background: drag ? 'var(--mint-soft)' : 'var(--surface)',
          textAlign: 'center', cursor: 'pointer',
          transition: 'all .15s ease',
        }}
      >
        <div style={{
          width: 64, height: 64, margin: '0 auto', borderRadius: 16,
          background: 'var(--mint-glow)', color: 'var(--mint)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name="upload" size={28}/>
        </div>
        <div className="fw-700 text-md mt-16">ลากไฟล์ PDF มาวางที่นี่</div>
        <div className="text-sm text-3 mt-8">หรือ <span className="text-mint">คลิกเพื่อเลือกไฟล์</span> · PDF · สูงสุด 25 MB</div>
        <div className="row center mt-20" style={{ gap: 8 }}>
          {['SCB', 'KBank', 'BBL', 'KTB', 'BAY', 'ttb'].map(b => (
            <span key={b} className="chip" style={{ fontSize: 10 }}>{b}</span>
          ))}
        </div>
      </div>

      <div className="row mt-16" style={{ gap: 10, color: 'var(--text-3)', fontSize: 12 }}>
        <Icon name="lock" size={14}/> ไฟล์ของคุณถูกแยกข้อความบนเครื่อง (on-device parsing) · ไม่ถูกอัปโหลดถาวร
      </div>
    </div>
  );
}

function PdfParsing({ onDone }) {
  const txns = window.MOCK.recentTxns;
  const [phase, setPhase] = useState('open'); // open → ocr → categorize → done
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('ocr'), 600);
    const t2 = setTimeout(() => setPhase('categorize'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'categorize') return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setRevealed(i);
      if (i >= txns.length) { clearInterval(id); setTimeout(() => setPhase('done'), 500); }
    }, 150);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }
  }, [phase]);

  return (
    <div className="appear">
      <span className="eyebrow">AI PARSING · กำลังประมวลผล</span>
      <h1 className="display mt-12" style={{ fontSize: 26 }}>
        statement_may_2026.pdf
      </h1>
      <div className="text-2 text-sm mt-8">487 ธุรกรรม · 30 หน้า · ประมวลผลในเครื่อง</div>

      <div className="card mt-20" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr' }}>
          {/* left: simulated PDF preview */}
          <div style={{ background: '#0A0D17', borderRight: '1px solid var(--border)', padding: 18, position: 'relative', minHeight: 460 }}>
            <div style={{ background: '#F5F0E6', borderRadius: 4, padding: '18px 14px', color: '#1a1a1a', fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, lineHeight: 1.5, position: 'relative', overflow: 'hidden', minHeight: 420 }}>
              <div style={{ fontWeight: 700, fontSize: 11 }}>SIAM COMMERCIAL BANK</div>
              <div style={{ fontSize: 8, color: '#666' }}>Account Statement · Period: 01–31 May 2026</div>
              <div style={{ borderTop: '1px solid #ccc', margin: '10px 0', fontSize: 8 }}>{'─'.repeat(60)}</div>
              <div style={{ fontWeight: 700, fontSize: 8 }}>DATE       MERCHANT                   AMOUNT</div>
              <div style={{ borderTop: '1px solid #ccc', margin: '4px 0' }}></div>
              {txns.map((tx, i) => {
                const isScanning = phase === 'ocr' && i < 8;
                const isHighlighted = phase === 'categorize' && i < revealed;
                return (
                  <div key={i} style={{
                    padding: '2px 4px', margin: '0 -4px',
                    background: isHighlighted ? 'rgba(52,211,153,.25)' : isScanning ? 'rgba(96,165,250,.18)' : 'transparent',
                    transition: 'background .2s',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{tx.date.padEnd(10, ' ')} {tx.note.padEnd(20, ' ').slice(0, 20)}</span>
                    <span style={{ fontWeight: 600 }}>-{tx.amt}.00</span>
                  </div>
                );
              })}
              {phase === 'ocr' && (
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)', top: 60, animation: 'scan 1s linear infinite' }}/>
              )}
            </div>
            <style>{`@keyframes scan { from { top: 50px; } to { top: 420px; } }`}</style>
          </div>

          {/* right: categorization */}
          <div style={{ padding: 22 }}>
            <div className="row between mb-16">
              <div>
                <div className="fw-700 text-md">
                  {phase === 'open' && 'กำลังเปิดไฟล์…'}
                  {phase === 'ocr' && 'แยกข้อความ (OCR)…'}
                  {phase === 'categorize' && 'จัดหมวดด้วย AI…'}
                  {phase === 'done' && 'เสร็จสิ้น · พร้อมใช้งาน'}
                </div>
                <div className="text-xs text-3 mt-8">
                  {phase === 'categorize' && `${revealed} / ${txns.length} ธุรกรรม`}
                  {phase === 'done' && `${txns.length}+ ธุรกรรม · 10 หมวด · 5 จุดรั่วพบ`}
                </div>
              </div>
              <div className={`chip ${phase === 'done' ? 'chip-mint' : ''}`}>
                {phase === 'done' ? <><Icon name="check" size={11} stroke={3}/> Done</> : <><span className="chip-dot" style={{ background: 'var(--mint)' }}/>Processing</>}
              </div>
            </div>

            <div className="bar mb-16" style={{ height: 4 }}>
              <div className="bar-fill bar-savings" style={{ width: `${phase === 'open' ? 8 : phase === 'ocr' ? 28 : phase === 'categorize' ? 30 + (revealed / txns.length) * 60 : 100}%` }}/>
            </div>

            <div style={{ maxHeight: 360, overflow: 'hidden', position: 'relative' }}>
              {txns.slice(0, revealed).reverse().map((tx, i) => (
                <div key={tx.merchant + i} className="row" style={{
                  padding: '8px 0', borderTop: '1px solid var(--border)', gap: 10,
                  animation: 'ticker .3s ease both',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>
                    {tx.merchant.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-md fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merchant}</div>
                    <div className="text-xs text-3">{tx.date}</div>
                  </div>
                  <span className={`chip ${tx.type === 'needs' ? 'chip-needs' : 'chip-wants'}`} style={{ fontSize: 10 }}>
                    <span className="chip-dot"/>{tx.type === 'needs' ? 'จำเป็น' : 'ตามใจ'}
                  </span>
                  <div className="figure text-md tabular" style={{ width: 70, textAlign: 'right' }}>-฿{tx.amt}</div>
                </div>
              ))}
              {revealed < 3 && phase !== 'done' && (
                <div className="text-xs text-3" style={{ padding: 30, textAlign: 'center' }}>
                  Waiting for AI…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IngestionDone({ onContinue }) {
  return (
    <div className="appear">
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center' }}>
        <Icon name="check" size={32} stroke={3}/>
      </div>
      <h1 className="display mt-16" style={{ fontSize: 28 }}>
        นำเข้าข้อมูล <span className="accent">สำเร็จ</span>
      </h1>
      <p className="lede">เราพบรูปแบบการใช้จ่ายที่น่าสนใจ ดูแดชบอร์ดเพื่อเห็นภาพรวมและจุดรั่วไหลทางการเงินของคุณ</p>
      <button className="btn btn-primary btn-lg mt-20" onClick={onContinue}>
        ดูแดชบอร์ด · View Dashboard <Icon name="arrowRight" size={14}/>
      </button>
    </div>
  );
}

/* ─────────────── Sidebar cards ─────────────── */
function NoManualCard() {
  return (
    <div className="card">
      <div className="row" style={{ gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)' }}>
          <Icon name="sparkle" size={14}/>
        </div>
        <BL th="3 Solution ในที่เดียว" en="3 ways, one app"/>
      </div>
      <div className="text-sm text-2 mt-12" style={{ lineHeight: 1.55 }}>
        เลือกวิธีที่เหมาะกับไลฟ์สไตล์ของคุณ — จะตั้งอย่างใดอย่างหนึ่งหรือผสมผสานก็ได้
      </div>
      <div className="col mt-12" style={{ gap: 6 }}>
        <div className="row text-xs"><Icon name="check" size={12} className="text-mint" stroke={3} style={{ marginRight: 6 }}/> <b>Auto</b> · Banking API · ซิงค์อัตโนมัติ</div>
        <div className="row text-xs"><Icon name="check" size={12} className="text-mint" stroke={3} style={{ marginRight: 6 }}/> <b>Bulk</b> · PDF Statement · ย้อนหลัง</div>
        <div className="row text-xs"><Icon name="check" size={12} className="text-mint" stroke={3} style={{ marginRight: 6 }}/> <b>Manual</b> · เพิ่มเอง + AI Receipt</div>
      </div>
      <div className="text-xs text-3 mt-12" style={{ paddingTop: 12, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
        เราแนะนำให้เชื่อมต่ออัตโนมัติเพื่อความแม่นยำ แต่บันทึกเองได้เสมอสำหรับเงินสดหรือรายการพิเศษ
      </div>
    </div>
  );
}

function SupportedSourcesCard() {
  return (
    <div className="card">
      <div className="card-title">รองรับแหล่งข้อมูล · Sources</div>
      <div className="text-xs text-3 mt-8 mb-12">12 ธนาคาร · 4 e-wallet · 2 บัตรเครดิต</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          ['SCB',   '#5E2A87'], ['KBnk',  '#0E9F6E'], ['BBL',   '#1F4FAA'], ['KTB',   '#00A8E1'],
          ['BAY',   '#FCC400'], ['ttb',   '#1656A0'], ['GSB',   '#E91E63'], ['UOB',   '#003DA5'],
          ['Line',  '#06C755'], ['True',  '#E51E25'], ['ShopeeP','#EE4D2D'],['+1',    '#475569'],
        ].map(([n, c], i) => (
          <div key={i} style={{
            height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-2)',
            display: 'grid', placeItems: 'center', position: 'relative',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: c, display: 'grid', placeItems: 'center', color: 'white', fontSize: 9, fontWeight: 700 }}>{n[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustStripCompact() {
  return (
    <div className="card" style={{ background: 'linear-gradient(180deg, var(--surface), var(--bg-2))' }}>
      <div className="card-title row" style={{ gap: 8 }}>
        <Icon name="shield" size={16} className="text-mint"/> Bank-Grade Security
      </div>
      <div className="col mt-12" style={{ gap: 8 }}>
        {[
          { ic: 'lock', th: 'AES-256 Encryption', en: 'In transit & at rest' },
          { ic: 'cert', th: 'PDPA Compliant',     en: 'Thailand Data Protection Act' },
          { ic: 'eye',  th: 'Read-Only Access',   en: 'We cannot move your money' },
        ].map(b => (
          <div key={b.ic} className="row" style={{ gap: 10, padding: '6px 0' }}>
            <Icon name={b.ic} size={14} className="text-mint"/>
            <div>
              <div className="text-sm fw-600">{b.th}</div>
              <div className="text-xs text-3">{b.en}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.StepConnect = StepConnect;
