// Step 2 — Dashboard & AI Analytics. Filters, KPIs, daily spend chart,
// Needs vs Wants breakdown, Financial Leaks panel, drill-in.

function StepDashboard({ ctx }) {
  const [range, setRange] = useState('month'); // week | month | year
  const [drillCat, setDrillCat] = useState(null); // category id or null
  const [selectedLeak, setSelectedLeak] = useState(null);

  const { categories, monthSpend, needsTotal, wantsTotal, persona, txns, totalIncome } = ctx;

  // derive daily spend from txns (so manual add/edit moves the chart)
  const daily = useMemo(() => {
    const buckets = new Array(30).fill(0);
    txns.forEach(t => {
      const day = +t.date.slice(-2);
      if (day >= 1 && day <= 30) buckets[day - 1] += t.amount;
    });
    return buckets;
  }, [txns]);
  const totalLeaks = window.MOCK.leaks.reduce((s, l) => s + l.over, 0);
  const savingsRate = totalIncome > 0 ? 1 - monthSpend / totalIncome : 0;

  return (
    <div>
      {/* hero strip */}
      <div className="row between mb-16">
        <div>
          <span className="eyebrow">STEP 02 · DASHBOARD & AI ANALYTICS</span>
          <h1 className="display mt-8" style={{ fontSize: 28 }}>
            ภาพรวมการใช้จ่าย <span className="accent">เดือนพฤษภาคม 2026</span>
          </h1>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="seg">
            {['week', 'month', 'year'].map(r => (
              <button key={r} className={`seg-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                {r === 'week' ? 'สัปดาห์' : r === 'month' ? 'เดือน' : 'ปี'}
                <span className="seg-en">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-sm"><Icon name="filter" size={12}/> Filters</button>
          <button className="btn btn-sm"><Icon name="refresh" size={12}/> Sync</button>
        </div>
      </div>

      {/* Cash Flow overview — Income vs Outcome */}
      <CashFlowStrip ctx={ctx} />

      <style>{`
        .seg { display: inline-flex; background: var(--surface-2); border: 1px solid var(--border-2); border-radius: 10px; padding: 3px; }
        .seg-btn { appearance: none; background: transparent; border: 0; color: var(--text-3); padding: 6px 12px; border-radius: 7px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .seg-btn .seg-en { font-size: 10px; color: var(--text-4); }
        .seg-btn:hover { color: var(--text); }
        .seg-btn.active { background: var(--surface-3); color: var(--text); box-shadow: 0 1px 2px rgba(0,0,0,.2); }
        .seg-btn.active .seg-en { color: var(--text-3); }
      `}</style>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
        <KPI
          label="รายจ่ายเดือนนี้" labelEn="Total spend this month"
          value={window.MOCK.fmt(monthSpend)}
          sub={`รายได้ ${window.MOCK.fmtK(totalIncome)}`}
          delta={+9.4} deltaLabel="vs last"
          accent="var(--text)"
          icon="chart"
        />
        <KPI
          label="จำเป็น vs ตามใจ" labelEn="Needs vs Wants"
          value={`${Math.round(needsTotal / monthSpend * 100)} / ${Math.round(wantsTotal / monthSpend * 100)}`}
          sub={`${window.MOCK.fmtK(needsTotal)} / ${window.MOCK.fmtK(wantsTotal)}`}
          accent="var(--needs)"
          icon="pie"
        />
        <KPI
          label="อัตราการออม" labelEn="Savings rate"
          value={`${(savingsRate * 100).toFixed(1)}%`}
          sub={`เป้า 20% ${savingsRate >= 0.2 ? '· บรรลุ' : '· ต่ำกว่าเป้า'}`}
          delta={-2.3} deltaLabel=""
          accent={savingsRate >= 0.2 ? 'var(--savings)' : 'var(--leak)'}
          icon="coins"
        />
        <KPI
          label="จุดรั่วไหลทางการเงิน" labelEn="Financial leaks · potential"
          value={window.MOCK.fmt(totalLeaks)}
          sub="ประหยัดได้ถ้าจัดการจุดเหล่านี้"
          accent="var(--leak)"
          icon="alert"
        />
      </div>

      {/* MAIN GRID — chart + leaks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 14, marginTop: 14 }}>
        <DailySpendChart daily={daily} range={range} />
        <FinancialLeaksPanel
          leaks={window.MOCK.leaks}
          selected={selectedLeak}
          onSelect={setSelectedLeak}
        />
      </div>

      {/* Needs vs Wants split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <CategoryColumn type="needs" categories={categories.filter(c => c.type === 'needs')} total={needsTotal} monthSpend={monthSpend} onDrill={setDrillCat}/>
        <CategoryColumn type="wants" categories={categories.filter(c => c.type === 'wants')} total={wantsTotal} monthSpend={monthSpend} onDrill={setDrillCat}/>
      </div>

      {/* AI insights strip */}
      <AIInsightsStrip categories={categories} leaks={window.MOCK.leaks} persona={persona}/>

      {/* Income sources + Transactions side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14, marginTop: 16 }}>
        <IncomeSourcesCard ctx={ctx} />
        <TransactionsView ctx={ctx} />
      </div>

      {/* drill modal */}
      {drillCat && (
        <DrillPanel
          cat={categories.find(c => c.id === drillCat)}
          onClose={() => setDrillCat(null)}
        />
      )}
    </div>
  );
}

/* ─────────────── Daily spend area chart ─────────────── */
function DailySpendChart({ daily, range }) {
  const W = 760, H = 280, P = { l: 44, r: 16, t: 28, b: 32 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const max = Math.max(...daily) * 1.15;
  const x = (i) => P.l + (i / (daily.length - 1)) * innerW;
  const y = (v) => P.t + innerH - (v / max) * innerH;
  const linePath = daily.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(daily.length - 1).toFixed(1)},${P.t + innerH} L${x(0).toFixed(1)},${P.t + innerH} Z`;
  const total = daily.reduce((s, v) => s + v, 0);
  const avg = total / daily.length;

  // annotations: pick the 2 biggest spikes
  const ranked = daily.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const spikes = ranked.slice(0, 2);

  const [hover, setHover] = useState(null); // index
  const labels = ['1', '5', '10', '15', '20', '25', '30'];

  return (
    <div className="card" style={{ minHeight: 340 }}>
      <div className="card-head">
        <div>
          <div className="card-title">การใช้จ่ายรายวัน · Daily Spend</div>
          <div className="card-sub">30 วันที่ผ่านมา · เฉลี่ย ฿{Math.round(avg).toLocaleString()}/วัน</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="chip"><span className="chip-dot" style={{ background: 'var(--mint)' }}/>Daily</span>
          <span className="chip"><span className="chip-dot" style={{ background: 'var(--leak)' }}/>Leak day</span>
          <span className="chip"><span className="chip-dot" style={{ background: 'var(--text-3)' }}/>Avg</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="var(--mint)" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={P.t + p * innerH} y2={P.t + p * innerH} className="grid-line"/>
            <text x={P.l - 6} y={P.t + p * innerH + 3} textAnchor="end" className="axis-text">
              {Math.round(max * (1 - p) / 1000)}k
            </text>
          </g>
        ))}

        {/* avg line */}
        <line x1={P.l} x2={W - P.r} y1={y(avg)} y2={y(avg)} stroke="var(--text-3)" strokeDasharray="3 5" strokeWidth="1"/>
        <text x={W - P.r} y={y(avg) - 4} textAnchor="end" className="axis-text" fill="var(--text-3)">avg ฿{Math.round(avg).toLocaleString()}</text>

        {/* area */}
        <path d={areaPath} fill="url(#area-grad)"/>
        <path d={linePath} fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinejoin="round"/>

        {/* dots */}
        {daily.map((v, i) => {
          const isSpike = spikes.some(s => s.i === i);
          return (
            <circle
              key={i}
              cx={x(i)} cy={y(v)} r={isSpike ? 4 : hover === i ? 4 : 0}
              fill={isSpike ? 'var(--leak)' : 'var(--mint)'}
              stroke="var(--bg-2)" strokeWidth="2"
            />
          );
        })}

        {/* annotations */}
        {spikes.map((s, k) => (
          <g key={k}>
            <line x1={x(s.i)} y1={y(s.v) - 8} x2={x(s.i)} y2={y(s.v) - 26} stroke="var(--leak)" strokeWidth="1"/>
            <rect x={x(s.i) - 50} y={y(s.v) - 46} width="100" height="18" rx="4" fill="var(--leak-bg)" stroke="var(--leak-line)"/>
            <text x={x(s.i)} y={y(s.v) - 33} textAnchor="middle" fontSize="10" fill="var(--leak)" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
              LEAK · ฿{(s.v / 1000).toFixed(1)}k
            </text>
          </g>
        ))}

        {/* x labels */}
        {labels.map((l, i) => (
          <text key={i} x={P.l + (Number(l) - 1) / 29 * innerW} y={H - 12} textAnchor="middle" className="axis-text">{l}</text>
        ))}

        {/* hover overlay */}
        {daily.map((v, i) => (
          <rect key={i} x={x(i) - innerW / daily.length / 2} y={P.t} width={innerW / daily.length} height={innerH}
            fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}/>
        ))}

        {/* hover tooltip */}
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={P.t} x2={x(hover)} y2={P.t + innerH} stroke="var(--mint)" strokeDasharray="2 2"/>
            <rect x={x(hover) + 8} y={y(daily[hover]) - 24} width="92" height="36" rx="6" fill="var(--surface-3)" stroke="var(--border-3)"/>
            <text x={x(hover) + 14} y={y(daily[hover]) - 10} fontSize="10" fill="var(--text-3)">วันที่ {hover + 1}</text>
            <text x={x(hover) + 14} y={y(daily[hover]) + 4} fontSize="12" fontWeight="700" fill="var(--text)" fontFamily="'JetBrains Mono', monospace">฿{daily[hover].toLocaleString()}</text>
          </g>
        )}
      </svg>

      <div className="row mt-12" style={{ gap: 14, padding: '0 4px' }}>
        <div className="grow">
          <div className="text-xs text-3">รวม · Total</div>
          <div className="figure figure-md">{window.MOCK.fmt(total)}</div>
        </div>
        <div className="divider-v" style={{ height: 32 }}/>
        <div className="grow">
          <div className="text-xs text-3">วันใช้จ่ายสูงสุด · Peak day</div>
          <div className="figure figure-md text-leak">{window.MOCK.fmt(Math.max(...daily))}</div>
        </div>
        <div className="divider-v" style={{ height: 32 }}/>
        <div className="grow">
          <div className="text-xs text-3">วันต่ำสุด · Low day</div>
          <div className="figure figure-md text-mint">{window.MOCK.fmt(Math.min(...daily))}</div>
        </div>
        <div className="divider-v" style={{ height: 32 }}/>
        <div className="grow">
          <div className="text-xs text-3">วันใช้จ่าย · Active</div>
          <div className="figure figure-md">{daily.filter(d => d > 0).length} / 30</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Financial Leaks Panel ─────────────── */
function FinancialLeaksPanel({ leaks, selected, onSelect }) {
  return (
    <div className="card card-flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-head" style={{ padding: 'var(--pad-card)', marginBottom: 0, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name="alert" size={14} className="text-leak"/>
            จุดรั่วไหลทางการเงิน
          </div>
          <div className="card-sub">Financial Leaks · ตรวจพบโดย AI</div>
        </div>
        <div className="chip chip-leak"><span className="chip-dot"/>5 พบ</div>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 360 }}>
        {leaks.map((l, i) => {
          const sevColor = l.severity === 'high' ? 'var(--leak)' : l.severity === 'medium' ? 'var(--wants)' : 'var(--text-3)';
          const isSel = selected === l.id;
          return (
            <div key={l.id}
              onClick={() => onSelect(isSel ? null : l.id)}
              style={{
                padding: '14px 20px', borderTop: i === 0 ? 0 : '1px solid var(--border)',
                cursor: 'pointer', background: isSel ? 'var(--surface-2)' : 'transparent',
                position: 'relative',
              }}>
              <div className="row between">
                <div className="row" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `color-mix(in oklab, ${sevColor} 18%, transparent)`,
                    color: sevColor, display: 'grid', placeItems: 'center', flexShrink: 0,
                    border: `1px solid color-mix(in oklab, ${sevColor} 30%, transparent)`,
                  }}>
                    <Icon name="flame" size={13}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-md fw-700" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.th}</div>
                    <div className="text-xs text-3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.en}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="figure text-md text-leak">฿{l.over.toLocaleString()}</div>
                  <div className="text-xs text-3">เกินงบ</div>
                </div>
              </div>
              {isSel && (
                <div className="appear" style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div className="text-sm">{l.detail}</div>
                  <div className="text-xs text-3 mt-8">{l.detailEn}</div>
                  <div className="row mt-12" style={{ gap: 8 }}>
                    <button className="btn btn-sm btn-primary" style={{ background: sevColor, borderColor: sevColor }}>
                      <Icon name="sparkle" size={11}/> ดูคำแนะนำ AI
                    </button>
                    <button className="btn btn-sm">ตั้งงบ</button>
                    <button className="btn btn-sm btn-ghost">ไม่สนใจ</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="text-xs text-3">รวมเงินที่อาจประหยัดได้</div>
          <div className="figure figure-md text-mint">฿{leaks.reduce((s, l) => s + l.over, 0).toLocaleString()}</div>
        </div>
        <button className="btn btn-sm btn-primary"><Icon name="sparkle" size={12}/> สร้างแผนประหยัด</button>
      </div>
    </div>
  );
}

/* ─────────────── Category column (Needs / Wants) ─────────────── */
function CategoryColumn({ type, categories, total, monthSpend, onDrill }) {
  const isNeeds = type === 'needs';
  const color = isNeeds ? 'var(--needs)' : 'var(--wants)';
  const sorted = [...categories].sort((a, b) => b.amt - a.amt);
  const maxAmt = sorted[0]?.amt || 1;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <span className={`chip ${isNeeds ? 'chip-needs' : 'chip-wants'}`} style={{ fontSize: 11 }}>
              <span className="chip-dot"/>
              {isNeeds ? 'รายจ่ายจำเป็น · NEEDS' : 'รายจ่ายตามใจ · WANTS'}
            </span>
            <span className="text-xs text-3">{categories.length} หมวด</span>
          </div>
          <div className="figure figure-lg mt-8" style={{ color }}>{window.MOCK.fmt(total)}</div>
          <div className="text-xs text-3 mt-8">
            {(total / monthSpend * 100).toFixed(1)}% ของรายจ่ายเดือนนี้ · target {isNeeds ? '50%' : '30%'}
          </div>
        </div>
        <div style={{ width: 88, height: 88, position: 'relative' }}>
          <RingDial value={total / monthSpend} target={isNeeds ? 0.5 : 0.3} color={color}/>
        </div>
      </div>

      <div className="col" style={{ gap: 6 }}>
        {sorted.map(c => (
          <button key={c.id} onClick={() => onDrill(c.id)} className="catrow">
            <div className="row" style={{ gap: 10, flex: 1, minWidth: 0 }}>
              <div className="catdot" style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color, borderColor: `color-mix(in oklab, ${color} 35%, transparent)` }}>
                {c.en.slice(0, 1)}
              </div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row between" style={{ gap: 8 }}>
                  <div className="text-md fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.th}</div>
                  <div className="figure text-md tabular">{window.MOCK.fmt(c.amt)}</div>
                </div>
                <div className="row between" style={{ gap: 8, marginTop: 4 }}>
                  <div className="text-xs text-3">{c.en} · {c.txns} ครั้ง</div>
                  <div className={`text-xs fw-600 ${c.trend > 5 ? 'delta-up' : c.trend < -5 ? 'delta-down' : 'text-3'}`}>
                    {c.trend > 0 ? '↑' : c.trend < 0 ? '↓' : '·'} {Math.abs(c.trend).toFixed(1)}%
                  </div>
                </div>
                <div className="bar mt-8">
                  <div className="bar-fill" style={{ width: `${c.amt / maxAmt * 100}%`, background: color }}/>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .catrow { appearance: none; text-align: left; background: transparent; border: 0; padding: 10px 8px; border-radius: 10px; cursor: pointer; color: inherit; font-family: inherit; }
        .catrow:hover { background: var(--surface-2); }
        .catdot { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; font-weight: 700; font-size: 13px; border: 1px solid var(--border-2); flex-shrink: 0; }
      `}</style>
    </div>
  );
}

function RingDial({ value, target, color }) {
  // ring showing % of total, with target mark
  const R = 36, C = 2 * Math.PI * R;
  const pct = Math.min(1, value);
  const dash = pct * C;
  const targetAngle = target * 360 - 90;
  return (
    <svg viewBox="0 0 88 88" width="88" height="88">
      <circle cx="44" cy="44" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="8"/>
      <circle cx="44" cy="44" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${C - dash}`} transform="rotate(-90 44 44)"/>
      {/* target tick */}
      <g transform={`rotate(${targetAngle} 44 44) translate(80 44)`}>
        <line x1="-6" x2="2" y1="0" y2="0" stroke="var(--text-2)" strokeWidth="2.5"/>
      </g>
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
        fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="16" fill="var(--text)">
        {Math.round(pct * 100)}%
      </text>
      <text x="44" y="60" textAnchor="middle" fontSize="9" fill="var(--text-3)" fontFamily="'JetBrains Mono', monospace">
        tgt {Math.round(target * 100)}%
      </text>
    </svg>
  );
}

/* ─────────────── AI insights strip ─────────────── */
function AIInsightsStrip({ categories, leaks, persona }) {
  const insights = [
    {
      ic: 'sparkle',
      th: 'คุณใช้จ่ายร้านอาหารเพิ่มขึ้น 18% เดือนนี้',
      en: 'Dining out is up 18% vs last month',
      action: 'ตั้งงบรายสัปดาห์',
    },
    {
      ic: 'flame',
      th: 'พบสมัครสมาชิกซ้ำซ้อน 3 รายการ',
      en: '3 overlapping subscriptions detected',
      action: 'ดูรายการ',
    },
    {
      ic: 'target',
      th: 'ออม ฿1,400 ได้ทันที — ลด Grab Food เป็น 2 ครั้ง/สัปดาห์',
      en: 'Save ฿1,400 immediately — limit Grab Food to 2x/week',
      action: 'ใช้คำแนะนำนี้',
    },
  ];
  return (
    <div className="card mt-16" style={{ background: 'linear-gradient(135deg, var(--mint-soft), var(--surface) 60%)', borderColor: 'color-mix(in oklab, var(--mint) 25%, var(--border-2))' }}>
      <div className="card-head">
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name="sparkle" size={16} className="text-mint"/>
            คำแนะนำจาก AI · AI Insights
          </div>
          <div className="card-sub">อัปเดต 2 นาทีที่แล้ว · ปรับตามพฤติกรรมรายเดือน</div>
        </div>
        <button className="btn btn-sm"><Icon name="refresh" size={11}/> รีเฟรช</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {insights.map((ins, i) => (
          <div key={i} className="card card-tight" style={{ padding: 14, background: 'var(--bg-2)' }}>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid color-mix(in oklab, var(--mint) 35%, transparent)' }}>
                <Icon name={ins.ic} size={14}/>
              </div>
              <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}>{ins.th}</div>
            </div>
            <div className="text-xs text-3 mt-8">{ins.en}</div>
            <button className="btn btn-sm mt-12" style={{ width: '100%', justifyContent: 'center' }}>
              {ins.action} <Icon name="arrowRight" size={11}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Drill-in panel ─────────────── */
function DrillPanel({ cat, onClose }) {
  if (!cat) return null;
  const color = cat.type === 'needs' ? 'var(--needs)' : 'var(--wants)';
  // synthetic txns for this category
  const sampleMerchants = {
    rent: ['Property Co.', '— monthly rent —'],
    food: ['Tesco Lotus', 'Foodland', '7-Eleven', 'Big C', 'Tops Daily', 'Villa Market'],
    commute: ['BTS', 'MRT', 'Grab', 'Bolt', 'PTT Petrol'],
    utility: ['PEA Electric', 'MEA Water', 'AIS Mobile', 'True Internet'],
    health: ['Bumrungrad', 'Watsons', 'Boots'],
    dining: ['Grab Food', 'LineMan', 'Foodpanda', 'After You', 'Café Amazon', 'Starbucks'],
    shopping: ['Shopee', 'Lazada', 'IKEA', 'Uniqlo', 'Zara'],
    fun: ['Major Cineplex', 'Netflix', 'Steam', 'Concerts'],
    subs: ['Netflix', 'Disney+', 'Spotify', 'YouTube Premium', 'Apple TV+'],
    misc: ['Misc', 'ATM Fee', 'Bank Charge'],
  }[cat.id] || ['Vendor'];
  const txns = Array.from({ length: 8 }, (_, i) => ({
    date: `${14 - i} พ.ค.`,
    merchant: sampleMerchants[i % sampleMerchants.length],
    amt: Math.round(cat.amt / cat.txns * (0.6 + Math.random() * 0.8)),
  }));

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(7,9,15,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'grid', placeItems: 'center', animation: 'fadeIn .2s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card appear" style={{ width: 720, maxHeight: '80vh', overflow: 'auto', padding: 0 }}>
        <div className="row between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in oklab, ${color} 18%, transparent)`, color, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, border: `1px solid color-mix(in oklab, ${color} 35%, transparent)` }}>
              {cat.en.slice(0, 1)}
            </div>
            <div>
              <div className="fw-700 text-lg">{cat.th}</div>
              <div className="text-xs text-3">{cat.en} · {cat.txns} ธุรกรรม · {window.MOCK.fmt(cat.amt)}</div>
            </div>
            <span className={`chip ${cat.type === 'needs' ? 'chip-needs' : 'chip-wants'}`} style={{ marginLeft: 8 }}>
              <span className="chip-dot"/>{cat.type === 'needs' ? 'จำเป็น' : 'ตามใจ'}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 22 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="grow card card-tight">
              <div className="text-xs text-3">เดือนนี้</div>
              <div className="figure figure-md mt-8">{window.MOCK.fmt(cat.amt)}</div>
            </div>
            <div className="grow card card-tight">
              <div className="text-xs text-3">เฉลี่ย / ธุรกรรม</div>
              <div className="figure figure-md mt-8">{window.MOCK.fmt(cat.amt / cat.txns)}</div>
            </div>
            <div className="grow card card-tight">
              <div className="text-xs text-3">vs เดือนก่อน</div>
              <div className={`figure figure-md mt-8 ${cat.trend > 0 ? 'delta-up' : 'delta-down'}`}>
                {cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="card-title mt-20 mb-12">ธุรกรรมล่าสุด · Recent transactions</div>
          {txns.map((t, i) => (
            <div key={i} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>{t.merchant.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="text-md">{t.merchant}</div>
                  <div className="text-xs text-3">{t.date}</div>
                </div>
              </div>
              <div className="figure text-md">-{window.MOCK.fmt(t.amt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.StepDashboard = StepDashboard;
