// Step 4 — Trust & Security: bank-grade trust UI with badges & data flow.

function StepSecurity({ ctx }) {
  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span className="eyebrow">STEP 04 · TRUST & SECURITY</span>
          <h1 className="display mt-8" style={{ fontSize: 32 }}>
            ความปลอดภัย <span className="accent">ระดับธนาคาร</span>
          </h1>
          <p className="lede">
            SmartWallets AI ปกป้องข้อมูลของคุณด้วยมาตรฐานเดียวกับธนาคารชั้นนำ —
            เราเข้าถึงเพื่ออ่านเท่านั้น และไม่สามารถเคลื่อนย้ายเงินของคุณได้
          </p>
        </div>
        <SecurityScoreBadge/>
      </div>

      {/* Three trust pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <PillarCard
          icon="lock"
          th="AES-256 Encryption" en="Encryption at rest & in transit"
          detail="ข้อมูลทุกชิ้นถูกเข้ารหัสด้วย AES-256 — มาตรฐานเดียวกับที่กองทัพและสถาบันการเงินใช้ ทั้งระหว่างส่งและตอนเก็บ"
          detailEn="Every byte encrypted with AES-256 — military-grade. In transit & at rest."
          badges={['AES-256-GCM', 'TLS 1.3', 'PFS']}
          metric="256-bit"
          metricLabel="key length"
        />
        <PillarCard
          icon="cert"
          th="PDPA Compliant" en="Thailand Data Protection Act"
          detail="ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) อย่างเคร่งครัด — คุณเป็นเจ้าของข้อมูล สามารถดาวน์โหลดหรือลบได้ทุกเมื่อ"
          detailEn="Full compliance with Thailand's PDPA — your data is yours; export or delete anytime."
          badges={['PDPA 2562', 'GDPR-aligned', 'SOC 2']}
          metric="100%"
          metricLabel="data ownership"
          accent="var(--needs)"
        />
        <PillarCard
          icon="eye"
          th="Read-Only Access" en="We can never move your money"
          detail="เราขอสิทธิ์อ่านอย่างเดียวผ่าน Open Banking — SmartWallets ไม่สามารถโอน ถอน ชำระบิล หรือเปลี่ยนแปลงบัญชีของคุณได้ในทุกกรณี"
          detailEn="Read-only OAuth scope. We physically cannot transfer, withdraw, or modify accounts."
          badges={['OAuth 2.0', 'No transfer scope', 'Revocable']}
          metric="READ"
          metricLabel="scope only"
          accent="var(--wants)"
        />
      </div>

      {/* data flow diagram */}
      <div className="card mt-16">
        <div className="card-head">
          <div>
            <div className="card-title">เส้นทางข้อมูลของคุณ · Your data flow</div>
            <div className="card-sub">เข้ารหัสปลายทางตลอด · End-to-end encrypted at every hop</div>
          </div>
          <span className="chip chip-mint"><Icon name="bolt" size={11}/> Zero-knowledge</span>
        </div>
        <DataFlowDiagram/>
      </div>

      {/* What we can / cannot do */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <CapabilityList
          title="สิ่งที่ SmartWallets ทำได้"
          subtitle="What we can do"
          variant="can"
          items={[
            { th: 'อ่านประวัติธุรกรรมของคุณ',          en: 'Read your transaction history' },
            { th: 'ดูยอดคงเหลือเพื่อแสดงในแดชบอร์ด',   en: 'Read account balances' },
            { th: 'วิเคราะห์รูปแบบและจัดหมวด AI',    en: 'Analyze patterns with AI' },
            { th: 'แสดงคำแนะนำจุดรั่วไหลทางการเงิน',  en: 'Show financial leak insights' },
          ]}
        />
        <CapabilityList
          title="สิ่งที่ SmartWallets ทำไม่ได้"
          subtitle="What we physically cannot do"
          variant="cannot"
          items={[
            { th: 'โอนเงินจากบัญชีของคุณ',           en: 'Transfer money from your account' },
            { th: 'ถอนเงินสดหรือชำระบิลแทน',         en: 'Withdraw cash or pay bills for you' },
            { th: 'เปลี่ยน PIN หรือรหัสผ่าน',         en: 'Change PIN or password' },
            { th: 'แชร์ข้อมูลกับบุคคลที่สาม',         en: 'Share your data with third parties' },
          ]}
        />
      </div>

      {/* Compliance badges row */}
      <div className="card mt-16">
        <div className="card-head">
          <div>
            <div className="card-title">การรับรองและมาตรฐาน · Certifications</div>
            <div className="card-sub">ตรวจสอบและออดิตเป็นประจำโดยผู้ตรวจสอบอิสระ</div>
          </div>
          <a className="text-xs text-mint fw-600" style={{ cursor: 'pointer' }}>ดูรายงานความปลอดภัย →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {[
            { abbr: 'PDPA',  th: 'พ.ร.บ. คุ้มครองข้อมูล', en: 'Thailand 2562', color: 'var(--needs)' },
            { abbr: 'SOC 2', th: 'Type II',              en: 'Audited 2026', color: 'var(--mint)' },
            { abbr: 'ISO',   th: '27001',                en: 'Info security', color: 'var(--wants)' },
            { abbr: 'GDPR',  th: 'Aligned',              en: 'EU framework', color: 'var(--needs)' },
            { abbr: 'PCI',   th: 'DSS Level 1',          en: 'Card security', color: 'var(--mint)' },
            { abbr: 'OB',    th: 'Open Banking',         en: 'BoT certified', color: 'var(--wants)' },
          ].map(b => (
            <div key={b.abbr} className="card card-tight" style={{ padding: 14, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                width: 48, height: 48, margin: '0 auto', borderRadius: 12,
                background: `color-mix(in oklab, ${b.color} 14%, transparent)`,
                color: b.color, fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
                display: 'grid', placeItems: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid color-mix(in oklab, ${b.color} 30%, transparent)`,
                position: 'relative',
              }}>
                {b.abbr}
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--bg)', border: `1px solid ${b.color}`,
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name="check" size={8} stroke={3} style={{ color: b.color }}/>
                </div>
              </div>
              <div className="text-sm fw-600 mt-12">{b.th}</div>
              <div className="text-xs text-3" style={{ marginTop: 2 }}>{b.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Final reassurance band */}
      <div className="card mt-16" style={{
        background: 'radial-gradient(800px 200px at 50% 0%, var(--mint-soft), transparent 70%), var(--surface)',
        borderColor: 'color-mix(in oklab, var(--mint) 25%, var(--border-2))',
        textAlign: 'center', padding: 36,
      }}>
        <div style={{ width: 54, height: 54, margin: '0 auto', borderRadius: 14, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', border: '1px solid color-mix(in oklab, var(--mint) 35%, transparent)' }}>
          <Icon name="shield" size={26}/>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>
          พร้อมเริ่มจัดการเงินอย่างชาญฉลาด?
        </h2>
        <div className="text-sm text-2" style={{ maxWidth: 540, margin: '0 auto' }}>
          Ready to take control of your finances — securely?
        </div>
        <div className="row center mt-20" style={{ gap: 10 }}>
          <button className="btn btn-primary btn-lg">
            <Icon name="sparkle" size={14}/> เริ่มใช้งานฟรี · Start free
          </button>
          <button className="btn btn-lg">
            <Icon name="file" size={14}/> นโยบายความปลอดภัย
          </button>
        </div>
        <div className="text-xs text-3 mt-16">ทดลองใช้ฟรี 30 วัน · ไม่ต้องผูกบัตรเครดิต · ยกเลิกได้ทุกเมื่อ</div>
      </div>
    </div>
  );
}

/* ─────────────── Pillar card ─────────────── */
function PillarCard({ icon, th, en, detail, detailEn, badges, metric, metricLabel, accent }) {
  const c = accent || 'var(--mint)';
  return (
    <div className="card" style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(160deg, color-mix(in oklab, ${c} 8%, var(--surface)), var(--surface) 60%)`,
      borderColor: `color-mix(in oklab, ${c} 25%, var(--border-2))`,
      minHeight: 240,
    }}>
      <div style={{
        position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in oklab, ${c} 22%, transparent) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `color-mix(in oklab, ${c} 18%, transparent)`,
          color: c, display: 'grid', placeItems: 'center',
          border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
        }}>
          <Icon name={icon} size={20}/>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="figure" style={{ fontSize: 22, color: c, letterSpacing: '-0.02em' }}>{metric}</div>
          <div className="text-xs text-3" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{metricLabel}</div>
        </div>
      </div>
      <div className="fw-700 text-lg mt-16" style={{ fontSize: 16 }}>{th}</div>
      <div className="text-xs text-3" style={{ marginTop: 4 }}>{en}</div>
      <div className="text-sm text-2 mt-12" style={{ lineHeight: 1.55 }}>{detail}</div>
      <div className="text-xs text-3 mt-8" style={{ lineHeight: 1.5, fontStyle: 'italic' }}>{detailEn}</div>

      <div className="row mt-16" style={{ gap: 6, flexWrap: 'wrap' }}>
        {badges.map(b => (
          <span key={b} className="chip" style={{ fontSize: 10, padding: '3px 8px' }}>
            <Icon name="check" size={9} stroke={3} style={{ color: c }}/>{b}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Capability list (can / cannot) ─────────────── */
function CapabilityList({ title, subtitle, variant, items }) {
  const isCan = variant === 'can';
  const color = isCan ? 'var(--mint)' : 'var(--leak)';
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title row" style={{ gap: 8 }}>
            <Icon name={isCan ? 'check' : 'x'} size={14} stroke={3} style={{ color }}/>
            {title}
          </div>
          <div className="card-sub">{subtitle}</div>
        </div>
      </div>
      <div className="col" style={{ gap: 0 }}>
        {items.map((it, i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '12px 0', borderTop: i === 0 ? 0 : '1px solid var(--border)' }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `color-mix(in oklab, ${color} 14%, transparent)`,
              color, display: 'grid', placeItems: 'center', flexShrink: 0,
              border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
            }}>
              <Icon name={isCan ? 'check' : 'x'} size={12} stroke={3}/>
            </div>
            <div>
              <div className="text-md fw-600">{it.th}</div>
              <div className="text-xs text-3">{it.en}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Data flow diagram ─────────────── */
function DataFlowDiagram() {
  const W = 1240, H = 200;
  const nodes = [
    { x: 80,   th: 'ธนาคารของคุณ',      en: 'Your bank',         icon: 'bank',   color: 'var(--needs)' },
    { x: 340,  th: 'OAuth Read-Only',   en: 'Authorize once',     icon: 'lock',   color: 'var(--mint)' },
    { x: 600,  th: 'TLS 1.3 Tunnel',    en: 'AES-256 encrypted',  icon: 'shield', color: 'var(--mint)' },
    { x: 860,  th: 'AI ในเครื่อง',       en: 'On-device AI',       icon: 'sparkle',color: 'var(--wants)' },
    { x: 1120, th: 'แดชบอร์ดของคุณ',    en: 'Your dashboard',     icon: 'chart',  color: 'var(--needs)' },
  ];
  const y = 100;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--mint)"/>
        </marker>
        <linearGradient id="flow-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.2"/>
          <stop offset="50%" stopColor="var(--mint)" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.2"/>
        </linearGradient>
      </defs>

      {/* connector line */}
      {nodes.slice(0, -1).map((n, i) => {
        const next = nodes[i + 1];
        return (
          <g key={i}>
            <line x1={n.x + 40} y1={y} x2={next.x - 40} y2={y} stroke="var(--border-2)" strokeWidth="1" strokeDasharray="3 4"/>
            <circle cx={n.x + 40} cy={y} r="3" fill="var(--mint)">
              <animateMotion path={`M0,0 L${next.x - n.x - 80},0`} dur="2.5s" begin={`${i * 0.5}s`} repeatCount="indefinite"/>
            </circle>
          </g>
        );
      })}

      {/* nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={y} r="38" fill="var(--surface-2)" stroke={n.color} strokeWidth="1.5"/>
          <circle cx={n.x} cy={y} r="34" fill={`color-mix(in oklab, ${n.color} 12%, var(--surface))`} stroke="none"/>
          <foreignObject x={n.x - 14} y={y - 14} width="28" height="28">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'grid', placeItems: 'center', height: '100%', color: n.color }}>
              <Icon name={n.icon} size={20}/>
            </div>
          </foreignObject>
          <text x={n.x} y={y + 64} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">{n.th}</text>
          <text x={n.x} y={y + 80} textAnchor="middle" fontSize="11" fill="var(--text-3)">{n.en}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─────────────── Security score badge ─────────────── */
function SecurityScoreBadge() {
  return (
    <div className="card" style={{ padding: 16, minWidth: 260, background: 'linear-gradient(180deg, var(--mint-soft), var(--surface) 80%)', borderColor: 'color-mix(in oklab, var(--mint) 30%, var(--border-2))' }}>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--mint-glow)', color: 'var(--mint)', display: 'grid', placeItems: 'center', border: '1px solid color-mix(in oklab, var(--mint) 35%, transparent)' }}>
          <Icon name="shield" size={26}/>
        </div>
        <div>
          <div className="text-xs text-3" style={{ letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Security Score</div>
          <div className="figure" style={{ fontSize: 30, color: 'var(--mint)', lineHeight: 1 }}>A+</div>
          <div className="text-xs text-3">98 / 100 · audited 14 พ.ค. 2026</div>
        </div>
      </div>
    </div>
  );
}

window.StepSecurity = StepSecurity;
