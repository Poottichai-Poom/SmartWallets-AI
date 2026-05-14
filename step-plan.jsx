// Step 3 — Dynamic Financial Plan with draggable 50/30/20 pie + Life Goals.

function StepPlan({ ctx }) {
  const { planSplit, setPlanSplit, persona, goals, setGoals, monthSpend, totalIncome } = ctx;
  const income = totalIncome || persona.income;

  // when planSplit changes, derive allocations
  const alloc = {
    needs:   income * planSplit.needs   / 100,
    wants:   income * planSplit.wants   / 100,
    savings: income * planSplit.savings / 100,
  };
  const isDefault = planSplit.needs === 50 && planSplit.wants === 30 && planSplit.savings === 20;

  return (
    <div>
      <div className="row between mb-16">
        <div>
          <span className="eyebrow">STEP 03 · DYNAMIC FINANCIAL PLAN</span>
          <h1 className="display mt-8" style={{ fontSize: 28 }}>
            กฎ 50/30/20 <span className="accent">ที่ปรับให้คุณ</span>
          </h1>
          <p className="text-2 text-sm mt-8">ลากเส้นแบ่งเพื่อปรับสัดส่วน — หรือเพิ่มเป้าหมายชีวิตให้ AI ปรับให้อัตโนมัติ</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {!isDefault && (
            <button className="btn btn-sm" onClick={() => setPlanSplit({ needs: 50, wants: 30, savings: 20 })}>
              <Icon name="refresh" size={11}/> รีเซ็ต 50/30/20
            </button>
          )}
          <span className="chip chip-mint"><Icon name="sparkle" size={11}/> AI-Driven</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 14 }}>
        {/* LEFT — pie + breakdown */}
        <div className="col" style={{ gap: 14 }}>
          <PieCard planSplit={planSplit} setPlanSplit={setPlanSplit} income={income} alloc={alloc}/>
          <AllocationBreakdown alloc={alloc} planSplit={planSplit} income={income} monthSpend={monthSpend}/>
        </div>

        {/* RIGHT — Life Goals */}
        <div className="col" style={{ gap: 14 }}>
          <LifeGoalsPanel goals={goals} setGoals={setGoals} income={income} planSplit={planSplit} setPlanSplit={setPlanSplit}/>
          <AIRecommendCard goals={goals} planSplit={planSplit} setPlanSplit={setPlanSplit} income={income}/>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Interactive donut with draggable boundaries ─────────────── */
function PieCard({ planSplit, setPlanSplit, income, alloc }) {
  const svgRef = useRef(null);
  const SIZE = 360;
  const R_OUT = 150;
  const R_IN  = 96;
  const CX = SIZE / 2, CY = SIZE / 2;

  // boundary angles in degrees from 12 o'clock, clockwise
  const a1 = planSplit.needs * 3.6;
  const a2 = (planSplit.needs + planSplit.wants) * 3.6;

  function polar(angDeg, r) {
    const rad = (angDeg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
  }

  function arcPath(startDeg, endDeg) {
    const large = (endDeg - startDeg) % 360 > 180 ? 1 : 0;
    const [x1, y1] = polar(startDeg, R_OUT);
    const [x2, y2] = polar(endDeg,   R_OUT);
    const [x3, y3] = polar(endDeg,   R_IN);
    const [x4, y4] = polar(startDeg, R_IN);
    return `M${x1} ${y1} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${R_IN} ${R_IN} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  const [drag, setDrag] = useState(null); // 1 or 2 or null

  useEffect(() => {
    if (!drag) return;
    function onMove(e) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * SIZE - CX;
      const y = (e.clientY - rect.top)  / rect.height * SIZE - CY;
      let ang = Math.atan2(y, x) * 180 / Math.PI + 90;
      if (ang < 0) ang += 360;
      // clamp to keep at least 5% in each slice
      if (drag === 1) {
        const min = 5, max = a2 - 5;
        ang = Math.max(min, Math.min(max, ang));
        const newNeeds = ang / 3.6;
        const newWants = (a2 - ang) / 3.6;
        setPlanSplit({ needs: newNeeds, wants: newWants, savings: 100 - newNeeds - newWants });
      } else {
        const min = a1 + 5, max = 355;
        ang = Math.max(min, Math.min(max, ang));
        const newWants   = (ang - a1) / 3.6;
        const newSavings = (360 - ang) / 3.6;
        setPlanSplit({ needs: planSplit.needs, wants: newWants, savings: newSavings });
      }
    }
    function onUp() { setDrag(null); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [drag, a1, a2, planSplit.needs]);

  const [h1x, h1y] = polar(a1, (R_IN + R_OUT) / 2);
  const [h2x, h2y] = polar(a2, (R_IN + R_OUT) / 2);

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div className="card-head">
        <div>
          <div className="card-title">แผนงบประมาณ · Budget Plan</div>
          <div className="card-sub">ลากเส้นแบ่งสีเพื่อปรับสัดส่วน · Drag the dividers to rebalance</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="chip chip-needs"><span className="chip-dot"/>NEEDS · {planSplit.needs.toFixed(0)}%</span>
          <span className="chip chip-wants"><span className="chip-dot"/>WANTS · {planSplit.wants.toFixed(0)}%</span>
          <span className="chip chip-savings"><span className="chip-dot"/>SAVINGS · {planSplit.savings.toFixed(0)}%</span>
        </div>
      </div>

      <div className="row" style={{ gap: 28, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: 'block', cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}>
            {/* slices */}
            <path d={arcPath(0,  a1)} fill="var(--needs)"   opacity="0.92"/>
            <path d={arcPath(a1, a2)} fill="var(--wants)"   opacity="0.92"/>
            <path d={arcPath(a2, 360)} fill="var(--savings)" opacity="0.92"/>

            {/* boundary lines */}
            <line x1={polar(a1, R_IN)[0]} y1={polar(a1, R_IN)[1]} x2={polar(a1, R_OUT)[0]} y2={polar(a1, R_OUT)[1]} stroke="var(--bg)" strokeWidth="2.5"/>
            <line x1={polar(a2, R_IN)[0]} y1={polar(a2, R_IN)[1]} x2={polar(a2, R_OUT)[0]} y2={polar(a2, R_OUT)[1]} stroke="var(--bg)" strokeWidth="2.5"/>

            {/* handles */}
            <g onMouseDown={() => setDrag(1)} style={{ cursor: 'grab' }}>
              <circle cx={h1x} cy={h1y} r="14" fill="var(--bg)" stroke="var(--text)" strokeWidth="2.5"/>
              <line x1={h1x - 3} y1={h1y - 5} x2={h1x - 3} y2={h1y + 5} stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1={h1x + 3} y1={h1y - 5} x2={h1x + 3} y2={h1y + 5} stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
            <g onMouseDown={() => setDrag(2)} style={{ cursor: 'grab' }}>
              <circle cx={h2x} cy={h2y} r="14" fill="var(--bg)" stroke="var(--text)" strokeWidth="2.5"/>
              <line x1={h2x - 3} y1={h2y - 5} x2={h2x - 3} y2={h2y + 5} stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1={h2x + 3} y1={h2y - 5} x2={h2x + 3} y2={h2y + 5} stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* center label */}
            <circle cx={CX} cy={CY} r={R_IN - 6} fill="var(--surface)" stroke="var(--border)"/>
            <text x={CX} y={CY - 22} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="2">MONTHLY INCOME</text>
            <text x={CX} y={CY + 6} textAnchor="middle" fontSize="28" fill="var(--text)" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
              ฿{(income / 1000).toFixed(0)}k
            </text>
            <text x={CX} y={CY + 28} textAnchor="middle" fontSize="11" fill="var(--text-3)">รายได้ต่อเดือน</text>
          </svg>

          {/* slice labels */}
          {[
            { label: 'NEEDS',   th: 'จำเป็น',  pct: planSplit.needs,   ang: a1 / 2,         color: 'var(--needs)' },
            { label: 'WANTS',   th: 'ตามใจ',   pct: planSplit.wants,   ang: (a1 + a2) / 2,  color: 'var(--wants)' },
            { label: 'SAVINGS', th: 'ออม',     pct: planSplit.savings, ang: (a2 + 360) / 2, color: 'var(--savings)' },
          ].map((s, i) => {
            const [lx, ly] = polar(s.ang, (R_IN + R_OUT) / 2);
            return (
              <div key={i} style={{
                position: 'absolute',
                left: lx, top: ly, transform: 'translate(-50%, -50%)',
                pointerEvents: 'none', textAlign: 'center',
                color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>

        <div className="grow col" style={{ gap: 12 }}>
          {[
            { key: 'needs',   th: 'จำเป็น',  en: 'Needs',   pct: planSplit.needs,   amt: alloc.needs,   color: 'var(--needs)',   tgt: 50,
              ex: 'ค่าเช่า, อาหาร, ค่าเดินทาง, สาธารณูปโภค, สุขภาพ' },
            { key: 'wants',   th: 'ตามใจ',   en: 'Wants',   pct: planSplit.wants,   amt: alloc.wants,   color: 'var(--wants)',   tgt: 30,
              ex: 'ช้อปปิ้ง, ร้านอาหาร, บันเทิง, สมัครสมาชิก' },
            { key: 'savings', th: 'ออม + ลงทุน', en: 'Savings', pct: planSplit.savings, amt: alloc.savings, color: 'var(--savings)', tgt: 20,
              ex: 'เงินสำรอง, ลงทุน, เป้าหมายชีวิต' },
          ].map(r => {
            const delta = r.pct - r.tgt;
            return (
              <div key={r.key} className="row" style={{ gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: r.color, flexShrink: 0 }}/>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between">
                    <div className="fw-700 text-md">{r.th} <span className="text-3 fw-500 text-xs">/ {r.en}</span></div>
                    <div className="figure text-md tabular">฿{Math.round(r.amt).toLocaleString()}</div>
                  </div>
                  <div className="row between" style={{ marginTop: 2 }}>
                    <div className="text-xs text-3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{r.ex}</div>
                    <div className="text-xs" style={{ color: r.color }}>
                      <b>{r.pct.toFixed(0)}%</b>
                      <span className="text-3"> · tgt {r.tgt}% </span>
                      <span style={{ color: Math.abs(delta) < 1 ? 'var(--text-3)' : delta > 0 ? 'var(--mint)' : 'var(--leak)' }}>
                        ({delta > 0 ? '+' : ''}{delta.toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Allocation vs reality bar ─────────────── */
function AllocationBreakdown({ alloc, planSplit, income, monthSpend }) {
  const totalAlloc = alloc.needs + alloc.wants + alloc.savings;
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">จัดสรรเทียบกับการใช้จริง · Plan vs Actual</div>
          <div className="card-sub">เดือนพฤษภาคม 2026 — รายได้ ฿{income.toLocaleString()}</div>
        </div>
      </div>

      {/* income flow */}
      <div className="text-xs text-3 mb-8">PLAN · จัดสรร</div>
      <div className="bar-stack" style={{ height: 26, borderRadius: 8, marginBottom: 6 }}>
        <span style={{ width: `${planSplit.needs}%`,   background: 'var(--needs)' }}/>
        <span style={{ width: `${planSplit.wants}%`,   background: 'var(--wants)' }}/>
        <span style={{ width: `${planSplit.savings}%`, background: 'var(--savings)' }}/>
      </div>
      <div className="row" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ width: `${planSplit.needs}%` }}>฿{Math.round(alloc.needs / 1000)}k</span>
        <span style={{ width: `${planSplit.wants}%` }}>฿{Math.round(alloc.wants / 1000)}k</span>
        <span style={{ width: `${planSplit.savings}%` }}>฿{Math.round(alloc.savings / 1000)}k</span>
      </div>

      {/* actual */}
      <div className="text-xs text-3 mt-16 mb-8">ACTUAL · ใช้จริง</div>
      <ActualBar income={income} alloc={alloc}/>
    </div>
  );
}

function ActualBar({ income, alloc }) {
  // Compare with MOCK categories scaled by persona — we'll just pull from window globals
  const persona = window.MOCK.personas;
  // We'll approximate from mock data: needs and wants totals
  const needsTotal = window.MOCK.categories.filter(c => c.type === 'needs').reduce((s, c) => s + c.amt, 0);
  const wantsTotal = window.MOCK.categories.filter(c => c.type === 'wants').reduce((s, c) => s + c.amt, 0);
  const savingsActual = Math.max(0, income - needsTotal - wantsTotal);

  const n = needsTotal / income * 100;
  const w = wantsTotal / income * 100;
  const s = savingsActual / income * 100;

  const overN = n > alloc.needs / income * 100;
  return (
    <>
      <div className="bar-stack" style={{ height: 26, borderRadius: 8, marginBottom: 6 }}>
        <span style={{ width: `${n}%`, background: 'var(--needs)' }}/>
        <span style={{ width: `${w}%`, background: 'var(--wants)' }}/>
        <span style={{ width: `${s}%`, background: 'var(--savings)' }}/>
      </div>
      <div className="row" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ width: `${n}%` }}>฿{Math.round(needsTotal / 1000)}k <span style={{ color: overN ? 'var(--leak)' : 'var(--mint)' }}>·{n.toFixed(0)}%</span></span>
        <span style={{ width: `${w}%` }}>฿{Math.round(wantsTotal / 1000)}k <span style={{ color: 'var(--leak)' }}>·{w.toFixed(0)}%</span></span>
        <span style={{ width: `${s}%` }}>฿{Math.round(savingsActual / 1000)}k</span>
      </div>
      <div className="text-xs text-3 mt-12 row" style={{ gap: 8 }}>
        <Icon name="info" size={12}/>
        <span>ใช้จริงเดือนนี้ — Wants เกินงบ <b className="text-leak">{(w - 30).toFixed(0)}%</b>, AI แนะนำลด Dining out และ Subscriptions</span>
      </div>
    </>
  );
}

/* ─────────────── Life Goals panel ─────────────── */
function LifeGoalsPanel({ goals, setGoals, income, planSplit, setPlanSplit }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ th: '', en: '', target: 50000, months: 12 });

  function addGoal() {
    if (!form.th || !form.target) return;
    setGoals([...goals, { id: 'g' + Date.now(), ...form, saved: 0, byMonths: form.months, priority: 'medium' }]);
    setForm({ th: '', en: '', target: 50000, months: 12 });
    setAdding(false);
  }

  function removeGoal(id) {
    setGoals(goals.filter(g => g.id !== id));
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name="target" size={16} className="text-mint"/>
            เป้าหมายชีวิต · Life Goals
          </div>
          <div className="card-sub">เพิ่มเป้าหมาย — AI จะคำนวณ % ออมที่ต้องการ</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setAdding(!adding)}>
          <Icon name={adding ? 'x' : 'plus'} size={12} stroke={3}/> {adding ? 'ยกเลิก' : 'เพิ่มเป้าหมาย'}
        </button>
      </div>

      {adding && (
        <div className="card card-tight appear" style={{ background: 'var(--bg-2)', marginBottom: 12 }}>
          <div className="text-xs text-3 mb-8">เป้าหมายใหม่</div>
          <input
            value={form.th}
            onChange={(e) => setForm({ ...form, th: e.target.value })}
            placeholder="เช่น เก็บเงินซื้อรถ"
            className="goal-input"
          />
          <input
            value={form.en}
            onChange={(e) => setForm({ ...form, en: e.target.value })}
            placeholder="In English (optional)"
            className="goal-input mt-8"
          />
          <div className="row mt-12" style={{ gap: 8 }}>
            <div className="grow">
              <div className="text-xs text-3 mb-8">จำนวนเงิน (฿)</div>
              <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: +e.target.value })} className="goal-input"/>
            </div>
            <div className="grow">
              <div className="text-xs text-3 mb-8">ภายใน (เดือน)</div>
              <input type="number" value={form.months} onChange={(e) => setForm({ ...form, months: +e.target.value })} className="goal-input"/>
            </div>
          </div>
          <button className="btn btn-primary btn-sm mt-12" style={{ width: '100%', justifyContent: 'center' }} onClick={addGoal}>
            <Icon name="plus" size={12} stroke={3}/> เพิ่มเป้าหมาย
          </button>
        </div>
      )}

      <div className="col" style={{ gap: 10 }}>
        {goals.map(g => {
          const monthly = g.target / g.byMonths;
          const requiredPct = monthly / income * 100;
          const pctOfSavings = monthly / (income * planSplit.savings / 100) * 100;
          const fit = pctOfSavings <= 100;
          const progress = g.saved / g.target;
          return (
            <div key={g.id} className="card card-tight" style={{ padding: 14, background: 'var(--bg-2)' }}>
              <div className="row between">
                <div className="row" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: g.priority === 'high' ? 'var(--leak-bg)' : 'var(--mint-glow)',
                    color: g.priority === 'high' ? 'var(--leak)' : 'var(--mint)',
                    border: `1px solid ${g.priority === 'high' ? 'var(--leak-line)' : 'color-mix(in oklab, var(--mint) 30%, transparent)'}`,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Icon name={g.priority === 'high' ? 'flame' : 'target'} size={14}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-md fw-700" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.th}</div>
                    <div className="text-xs text-3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.en}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => removeGoal(g.id)} style={{ padding: 4 }}>
                  <Icon name="x" size={12}/>
                </button>
              </div>
              <div className="bar mt-12" style={{ height: 5 }}>
                <div className="bar-fill bar-savings" style={{ width: `${Math.min(100, progress * 100)}%` }}/>
              </div>
              <div className="row between mt-8" style={{ fontSize: 11 }}>
                <span className="text-3 mono">฿{g.saved.toLocaleString()} / ฿{g.target.toLocaleString()}</span>
                <span className="text-3">{g.byMonths} เดือน · ฿{Math.round(monthly).toLocaleString()}/เดือน</span>
              </div>
              <div className="row mt-12" style={{ padding: '8px 10px', borderRadius: 8, background: fit ? 'var(--mint-soft)' : 'var(--leak-bg)', fontSize: 11.5, gap: 8 }}>
                <Icon name={fit ? 'check' : 'alert'} size={12} className={fit ? 'text-mint' : 'text-leak'}/>
                <span>
                  ต้อง <b>{requiredPct.toFixed(1)}%</b> ของรายได้/เดือน
                  {fit ? ' — อยู่ในงบ Savings ปัจจุบัน' : ` — เกินงบ Savings ${planSplit.savings.toFixed(0)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .goal-input {
          width: 100%; background: var(--surface-2); border: 1px solid var(--border-2);
          color: var(--text); padding: 8px 12px; border-radius: 8px;
          font-family: inherit; font-size: 13px; outline: 0;
        }
        .goal-input:focus { border-color: var(--mint); box-shadow: 0 0 0 3px var(--mint-soft); }
        .goal-input[type="number"] { font-family: 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
}

/* ─────────────── AI Recommendation ─────────────── */
function AIRecommendCard({ goals, planSplit, setPlanSplit, income }) {
  // total monthly required for goals
  const reqMonthly = goals.reduce((s, g) => s + g.target / g.byMonths, 0);
  const reqPct = reqMonthly / income * 100;
  const currentSavings = planSplit.savings;
  const gap = reqPct - currentSavings;
  const needsAdjust = gap > 1;

  const recommended = needsAdjust
    ? { needs: Math.max(40, planSplit.needs - gap / 2), wants: Math.max(15, planSplit.wants - gap / 2), savings: Math.min(50, reqPct + 2) }
    : null;

  return (
    <div className="card" style={{ background: needsAdjust
      ? 'linear-gradient(135deg, color-mix(in oklab, var(--leak) 8%, var(--surface)), var(--surface) 60%)'
      : 'linear-gradient(135deg, var(--mint-soft), var(--surface) 60%)',
      borderColor: needsAdjust ? 'var(--leak-line)' : 'color-mix(in oklab, var(--mint) 30%, var(--border-2))'
    }}>
      <div className="row" style={{ gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: needsAdjust ? 'var(--leak-bg)' : 'var(--mint-glow)',
          color: needsAdjust ? 'var(--leak)' : 'var(--mint)',
          display: 'grid', placeItems: 'center',
          border: `1px solid ${needsAdjust ? 'var(--leak-line)' : 'color-mix(in oklab, var(--mint) 30%, transparent)'}`,
        }}>
          <Icon name="sparkle" size={18}/>
        </div>
        <div>
          <div className="fw-700 text-md">คำแนะนำจาก AI</div>
          <div className="text-xs text-3">AI Recommendation</div>
        </div>
      </div>
      <div className="text-sm mt-12" style={{ lineHeight: 1.55 }}>
        {needsAdjust ? (
          <>
            เป้าหมายของคุณต้องออม <b className="text-leak">฿{Math.round(reqMonthly).toLocaleString()}/เดือน</b>
            (~{reqPct.toFixed(0)}% ของรายได้) แต่งบ Savings ปัจจุบันคือ <b>{currentSavings.toFixed(0)}%</b>
            <div className="text-xs text-3 mt-8">Your goals require saving ~{reqPct.toFixed(0)}% but you've budgeted {currentSavings.toFixed(0)}%.</div>
          </>
        ) : (
          <>
            แผนปัจจุบันของคุณ <b className="text-mint">เพียงพอ</b> สำหรับเป้าหมายทั้ง {goals.length} รายการ — ออม ฿{Math.round(reqMonthly).toLocaleString()}/เดือนเข้าเป้า
            <div className="text-xs text-3 mt-8">Your current plan covers all {goals.length} goals.</div>
          </>
        )}
      </div>

      {recommended && (
        <>
          <div className="mt-16" style={{ padding: 12, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border-2)' }}>
            <div className="text-xs text-3 mb-8">AI แนะนำให้ปรับเป็น</div>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <span className="chip chip-needs">N · {recommended.needs.toFixed(0)}%</span>
              <Icon name="arrowRight" size={12} style={{ color: 'var(--text-3)' }}/>
              <span className="chip chip-wants">W · {recommended.wants.toFixed(0)}%</span>
              <Icon name="arrowRight" size={12} style={{ color: 'var(--text-3)' }}/>
              <span className="chip chip-savings">S · {recommended.savings.toFixed(0)}%</span>
            </div>
            <div className="text-xs text-3">ลด Wants ลง — AI เน้นไปที่ Dining out และ Subscriptions ที่เป็นจุดรั่วใหญ่</div>
          </div>
          <button className="btn btn-primary mt-12" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setPlanSplit(recommended)}>
            <Icon name="sparkle" size={12}/> ใช้คำแนะนำนี้ · Apply AI recommendation
          </button>
        </>
      )}
    </div>
  );
}

window.StepPlan = StepPlan;
