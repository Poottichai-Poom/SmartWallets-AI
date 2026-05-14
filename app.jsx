// SmartWallets AI — root app: stepper, layout, persona/theme/density tweaks.

const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "mint",
  "density": "regular",
  "persona": "pro"
}/*EDITMODE-END*/;

const STEPS = [
  { id: 'connect',   th: 'นำเข้าข้อมูล',     en: 'Data Ingestion',     sub: 'Connect a source — no manual entry' },
  { id: 'dashboard', th: 'แดชบอร์ดและ AI',   en: 'Dashboard & AI',     sub: 'See your spending, leaks & patterns' },
  { id: 'plan',      th: 'แผนการเงิน',       en: 'Financial Plan',     sub: '50/30/20 — rebalanced for your goals' },
  { id: 'security',  th: 'ความปลอดภัย',      en: 'Trust & Security',   sub: 'Bank-grade encryption + PDPA' },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [stepIdx, setStepIdx] = useState(0);
  const [connected, setConnected] = useState(false); // unlocks dashboard
  const [planSplit, setPlanSplit] = useState({ needs: 50, wants: 30, savings: 20 });
  const [goals, setGoals] = useState(window.MOCK.goals);

  // apply theme/density to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    document.documentElement.setAttribute('data-density', t.density);
  }, [t.theme, t.density]);

  // derive persona-adjusted spending
  const persona = window.MOCK.personas[t.persona] || window.MOCK.personas.pro;

  // transaction list — single source of truth for spending
  const [txns, setTxns] = useState(() => window.MOCK.generateSeedTxns(1.0));
  // income sources — single source of truth for income
  const [incomes, setIncomes] = useState(() => window.MOCK.incomeSources[t.persona] || window.MOCK.incomeSources.pro);
  const [lastPersona, setLastPersona] = useState(t.persona);
  useEffect(() => {
    if (t.persona !== lastPersona) {
      // regenerate seed txns scaled to new persona; keep any manual ones
      const manual = txns.filter(x => x.manual);
      setTxns([...window.MOCK.generateSeedTxns(persona.mult), ...manual].sort((a, b) => b.date.localeCompare(a.date)));
      // reset income sources from defaults; keep manual ones added by user
      const manualInc = incomes.filter(i => i.manual);
      setIncomes([...(window.MOCK.incomeSources[t.persona] || []), ...manualInc]);
      setLastPersona(t.persona);
    }
  }, [t.persona]);

  function addTxn(t) { setTxns(prev => [{ ...t, id: 'm' + Date.now() }, ...prev]); }
  function updateTxn(id, patch) { setTxns(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function deleteTxn(id) { setTxns(prev => prev.filter(x => x.id !== id)); }

  function addIncome(data) { setIncomes(prev => [...prev, { ...data, id: 'inc' + Date.now() }]); }
  function updateIncome(id, patch) { setIncomes(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function deleteIncome(id) { setIncomes(prev => prev.filter(x => x.id !== id)); }

  // derive categories + totals from current txn list
  const categories = useMemo(() => (
    window.MOCK.categories.map(c => {
      const matched = txns.filter(x => x.catId === c.id);
      const amt = matched.reduce((s, x) => s + x.amount, 0);
      return { ...c, amt, txns: matched.length };
    })
  ), [txns]);
  const monthSpend = categories.reduce((s, c) => s + c.amt, 0);
  const needsTotal = categories.filter(c => c.type === 'needs').reduce((s, c) => s + c.amt, 0);
  const wantsTotal = categories.filter(c => c.type === 'wants').reduce((s, c) => s + c.amt, 0);

  // total income — derived from income sources
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);

  const ctx = {
    t, setTweak, persona, categories, monthSpend, needsTotal, wantsTotal,
    planSplit, setPlanSplit, goals, setGoals,
    txns, addTxn, updateTxn, deleteTxn,
    incomes, addIncome, updateIncome, deleteIncome, totalIncome,
    onAdvance: () => setStepIdx(i => Math.min(STEPS.length - 1, i + 1)),
    onBack:    () => setStepIdx(i => Math.max(0, i - 1)),
    onComplete: () => setConnected(true),
    connected,
  };

  return (
    <div className="app" data-screen-label={`0${stepIdx + 1} ${STEPS[stepIdx].en}`}>
      <header className="appbar">
        <div className="brand">
          <div className="brand-mark"></div>
          <div className="brand-name">SmartWallets <span>AI</span></div>
        </div>
        <div className="text-xs text-3" style={{ marginLeft: 6, paddingLeft: 14, borderLeft: '1px solid var(--border)' }}>
          ผู้ช่วยการเงินส่วนตัวอัจฉริยะ · <span style={{ color: 'var(--text-2)' }}>Smart Personal Assistant</span>
        </div>
        <div className="appbar-right">
          <span className="row" style={{ gap: 6 }}><span className="live-dot"></span> Live · {persona.th}</span>
          <span className="kbd">⌘ K</span>
        </div>
      </header>

      <div className="stepper">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`step ${i === stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}
            onClick={() => setStepIdx(i)}
          >
            <div className="step-num">{i < stepIdx ? <Icon name="check" size={14} stroke={2.4}/> : String(i + 1).padStart(2, '0')}</div>
            <div className="step-body">
              <div className="step-title">{s.th}</div>
              <div className="step-sub">{s.en}</div>
            </div>
          </div>
        ))}
      </div>

      <main key={stepIdx} className="appear" style={{ padding: '28px 28px 12px' }}>
        {stepIdx === 0 && <StepConnect ctx={ctx} />}
        {stepIdx === 1 && <StepDashboard ctx={ctx} />}
        {stepIdx === 2 && <StepPlan ctx={ctx} />}
        {stepIdx === 3 && <StepSecurity ctx={ctx} />}
      </main>

      <footer className="appfoot">
        <div className="foot-meta">
          <span className="pill"><Icon name="lock" size={12} style={{ marginRight: 6, verticalAlign: '-2px' }}/>End-to-end encrypted</span>
          <span className="pill">PDPA Compliant</span>
          <span className="pill">Read-only access</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {stepIdx > 0 && (
            <button className="btn" onClick={ctx.onBack}>
              <Icon name="arrowLeft" size={14}/> ก่อนหน้า · Back
            </button>
          )}
          {stepIdx < STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={ctx.onAdvance}>
              ถัดไป · Continue to {STEPS[stepIdx + 1].en} <Icon name="arrowRight" size={14}/>
            </button>
          )}
          {stepIdx === STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={() => setStepIdx(0)}>
              เริ่มใช้งาน · Launch SmartWallets <Icon name="arrowRight" size={14}/>
            </button>
          )}
        </div>
      </footer>

      <TweaksPanel>
        <TweakSection label="Theme"/>
        <TweakColor
          label="Accent"
          value={
            t.theme === 'mint'   ? '#34D399' :
            t.theme === 'ocean'  ? '#22D3EE' :
            t.theme === 'violet' ? '#A78BFA' : '#FB923C'
          }
          options={['#34D399', '#22D3EE', '#A78BFA', '#FB923C']}
          onChange={(v) => {
            const map = { '#34D399': 'mint', '#22D3EE': 'ocean', '#A78BFA': 'violet', '#FB923C': 'sunset' };
            setTweak('theme', map[v] || 'mint');
          }}
        />
        <TweakSection label="Layout"/>
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'comfortable']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSection label="Persona"/>
        <TweakSelect
          label="Profile"
          value={t.persona}
          options={[
            { value: 'student', label: 'นักศึกษา · Student' },
            { value: 'pro',     label: 'พนักงานบริษัท · Young pro' },
            { value: 'family',  label: 'ครอบครัว · Family' },
          ]}
          onChange={(v) => setTweak('persona', v)}
        />
        <div className="text-xs text-3" style={{ padding: '4px 2px', lineHeight: 1.45 }}>
          เปลี่ยน Persona เพื่อดูข้อมูลที่ปรับตามรายได้และพฤติกรรมการใช้จ่าย
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
