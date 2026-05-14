// Shared bilingual + small icon components for SmartWallets AI.
// Exposed on window so all step files can use them.

/* ───── Bilingual label: Thai primary, English secondary ───── */
function BL({ th, en, dir = 'col', strong = true, className = '' }) {
  if (dir === 'row') {
    return (
      <span className={`bl bl-inline ${className}`}>
        <span className="bl-th">{th}</span>
        <span className="bl-en">{en}</span>
      </span>
    );
  }
  return (
    <span className={`bl ${className}`}>
      <span className="bl-th" style={{ fontWeight: strong ? 600 : 500 }}>{th}</span>
      <span className="bl-en">{en}</span>
    </span>
  );
}

/* ───── Icon: minimalist line glyphs, sized by font-size (1em) ───── */
function Icon({ name, size = 18, stroke = 1.6, style = {}, className = '' }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style, className,
  };
  const paths = {
    bank: <>
      <path d="M3 10l9-6 9 6"/>
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8"/>
      <path d="M3 20h18"/>
    </>,
    upload: <>
      <path d="M12 16V4"/>
      <path d="M6 10l6-6 6 6"/>
      <path d="M4 20h16"/>
    </>,
    file: <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <path d="M14 3v6h6"/>
    </>,
    lock: <>
      <rect x="4" y="11" width="16" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </>,
    shield: <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>
    </>,
    eye: <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </>,
    eyeOff: <>
      <path d="M3 3l18 18"/>
      <path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.4 4.3"/>
      <path d="M6.4 6.4A17 17 0 0 0 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.7"/>
      <path d="M9.9 10a3 3 0 1 0 4.2 4.2"/>
    </>,
    sparkle: <>
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/>
      <path d="M19 14l.8 2L22 17l-2.2.7L19 20l-.8-2.3L16 17l2.2-1z"/>
    </>,
    chart: <>
      <path d="M3 3v18h18"/>
      <path d="M7 15l4-5 3 3 5-7"/>
    </>,
    pie: <>
      <path d="M21 12A9 9 0 1 1 12 3v9z"/>
    </>,
    drag: <>
      <circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/>
      <circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>
    </>,
    arrowRight: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrowLeft:  <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
    check:      <path d="M5 13l4 4L19 7"/>,
    plus:       <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    x:          <><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></>,
    alert:      <><path d="M12 9v4"/><circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>,
    flame:      <path d="M12 3c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"/>,
    target:     <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    coins:      <><circle cx="9" cy="9" r="6"/><path d="M16.5 6.6A6 6 0 1 1 18 18l-1.5-.2"/></>,
    sun:        <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon:       <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
    settings:   <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    refresh:    <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></>,
    filter:     <path d="M3 4h18l-7 9v6l-4 2v-8z"/>,
    dot:        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>,
    server:     <><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7" cy="7.5" r=".7" fill="currentColor" stroke="none"/><circle cx="7" cy="16.5" r=".7" fill="currentColor" stroke="none"/></>,
    fingerprint:<><path d="M12 4a8 8 0 0 0-8 8c0 1 .2 2 .5 3"/><path d="M19.5 15c.3-1 .5-2 .5-3a8 8 0 0 0-3-6.2"/><path d="M8 12a4 4 0 0 1 8 0c0 2-.5 4-1 5.5"/><path d="M12 12c0 3-.5 5-1.5 7"/><path d="M14.5 19c.5-1 1-2 1-3"/></>,
    cert:       <><circle cx="12" cy="9" r="6"/><path d="M9 13l-2 8 5-3 5 3-2-8"/></>,
    arrowDown:  <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>,
    arrowUp:    <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>,
    info:       <><circle cx="12" cy="12" r="9"/><path d="M12 8v.5M12 11v5"/></>,
    bolt:       <path d="M13 2L3 14h7l-1 8 11-13h-7z"/>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
}

/* ───── Mini bank logo placeholder (color-tinted square + initials) ───── */
function BankLogo({ name, color, full = false }) {
  return (
    <div className="bank-logo">
      <span className="b-mark" style={{ background: color }}>{name.slice(0, 1)}</span>
      <span>{full ? name : name}</span>
    </div>
  );
}

/* ───── KPI card ───── */
function KPI({ label, labelEn, value, sub, delta, deltaLabel, accent, icon }) {
  const deltaCls = delta == null ? '' : delta > 0 ? 'delta-up' : 'delta-down';
  return (
    <div className="card card-tight" style={{ minHeight: 110 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="text-xs text-3" style={{ fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</div>
          <div className="text-xs text-3" style={{ marginTop: 1 }}>{labelEn}</div>
        </div>
        {icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: accent ? `color-mix(in oklab, ${accent} 14%, transparent)` : 'var(--surface-2)',
            color: accent || 'var(--text-2)',
            display: 'grid', placeItems: 'center',
            border: `1px solid ${accent ? `color-mix(in oklab, ${accent} 30%, transparent)` : 'var(--border-2)'}`,
          }}>
            <Icon name={icon} size={14} />
          </div>
        )}
      </div>
      <div className="figure figure-lg mt-12" style={{ color: accent || 'var(--text)' }}>{value}</div>
      <div className="row between mt-8">
        <span className="text-xs text-3">{sub}</span>
        {delta != null && (
          <span className={`text-xs fw-600 ${deltaCls}`}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% {deltaLabel}
          </span>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BL, Icon, BankLogo, KPI });
