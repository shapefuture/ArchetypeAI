import React, { useEffect, useMemo, useState } from 'react';

/* ---------- status bar ---------- */
export function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  const hh = now.getHours() % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className="statusbar">
      <span>{hh}:{mm}</span>
      <div className="notch" />
      <span className="sb-icons">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect y="7" width="3" height="5" rx="1" /><rect x="4.5" y="5" width="3" height="7" rx="1" /><rect x="9" y="2.5" width="3" height="9.5" rx="1" /><rect x="13.5" width="3" height="12" rx="1" opacity=".4" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 9.5a1.75 1.75 0 1 0 0 2.5 1.75 1.75 0 0 0 0-2.5Zm0-3.6c-1.7 0-3.24.66-4.4 1.72L2.2 6.2A8.45 8.45 0 0 1 8 3.8c2.2 0 4.2.87 5.8 2.4l-1.4 1.42A6.2 6.2 0 0 0 8 5.9Zm0-3.9C5.13 2 2.54 3.16.6 5.02L0 4.46A11.35 11.35 0 0 1 8-.1c3.06 0 5.87 1.23 7.98 3.22l-.6.62A10.6 10.6 0 0 0 8 2Z" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.2" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" /><path d="M23 4v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" opacity=".5" /></svg>
      </span>
    </div>
  );
}

/* ---------- family crest ---------- */
export function Crest({ family, size = 34 }) {
  const meta = {
    manager: { bg: '#3B9BFF', icon: '🧭' },
    firefighter: { bg: '#FF8A1F', icon: '🧯' },
    exile: { bg: '#FF2D8A', icon: '🕊️' },
    resource: { bg: '#3EE0B0', icon: '🌱' },
  }[family];
  return <div className="crest" style={{ background: meta.bg, width: size, height: size, fontSize: size * 0.48 }}>{meta.icon}</div>;
}

export const familyColor = (f) => ({ manager: '#3B9BFF', firefighter: '#FF8A1F', exile: '#FF2D8A', resource: '#3EE0B0' }[f]);

/* ---------- self-energy radar (SVG) ---------- */
export function Radar({ data, size = 240, labels }) {
  const keys = Object.keys(data);
  const n = keys.length;
  const cx = size / 2, cy = size / 2, R = size / 2 - 34;
  const pt = (i, r) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const poly = keys.map((k, i) => pt(i, Math.max(6, data[k] * R)).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={keys.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke="currentColor" opacity={0.14} strokeWidth={1.2} />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" opacity={0.12} />;
      })}
      <polygon points={poly} fill="#FFD000" fillOpacity={0.28} stroke="#FFD000" strokeWidth={2.5} strokeLinejoin="round" />
      {keys.map((k, i) => {
        const [x, y] = pt(i, R);
        const [lx, ly] = pt(i, R + 18);
        return (
          <g key={k}>
            <circle cx={pt(i, data[k] * R)[0]} cy={pt(i, data[k] * R)[1]} r={4} fill="#FFD000" stroke="#16161c" strokeWidth={1.5} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fontSize={labels ? 9.5 : 10.5} fontWeight={800} fill="currentColor" opacity={0.75}
              style={{ fontFamily: 'Fredoka, Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {labels ? labels[k] : k.slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- horizontal bars ---------- */
export function Bars({ items, cls = '' }) {
  return (
    <div>
      {items.map((it) => (
        <div key={it.k} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800, marginBottom: 5 }}>
            <span>{it.k}</span><span className="bar-v">{Math.round(it.v * 100)}%</span>
          </div>
          <div className={`bar ${cls}`}><i style={{ width: `${Math.round(it.v * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

/* ---------- sheet ---------- */
export function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="grab" />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 20px 0' }}>
            <div className="h2 grow">{title}</div>
            <button className="ibtn" style={{ width: 38, height: 38 }} onClick={onClose}>✕</button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

/* ---------- segmented ---------- */
export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/* ---------- steps ---------- */
export function Steps({ total, at }) {
  return <div className="steps">{Array.from({ length: total }, (_, i) => <i key={i} className={i <= at ? 'on' : ''} />)}</div>;
}

/* ---------- trusty icon (svg) ---------- */
export function Ico({ name, size = 22 }) {
  const p = {
    base: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
    sky: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z',
    code: 'M8 8 4 12l4 4m8-8 4 4-4 4m-3-11-2 14',
    you: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
    star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z',
    bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
    chat: 'M4 5h16v11H9l-5 4z',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Zm0 0v13m3-9h8',
    heart: 'M12 20s-7.5-4.6-9.2-9.4C1.4 6.4 3.8 3.5 7 3.5c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.2 0 5.6 2.9 4.2 7.1C19.5 15.4 12 20 12 20Z',
    gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-.2-1.6 1.7-1.3-1.7-3-2 .8a7 7 0 0 0-1.4-.8L16 4h-3.5l-.4 2.1a7 7 0 0 0-1.4.8l-2-.8-1.7 3 1.7 1.3L8.5 12l.2 1.6-1.7 1.3 1.7 3 2-.8c.4.3.9.6 1.4.8l.4 2.1H16l.4-2.1c.5-.2 1-.5 1.4-.8l2 .8 1.7-3-1.7-1.3.2-1.6Z',
  }[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'star' ? 'currentColor' : 'none'}
      stroke={name === 'star' ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

/* ---------- pretty number / price ---------- */
export function Price({ value, currency, suffix }) {
  const num = value % 1 === 0 ? value : value.toFixed(2);
  return (
    <span className="p-price">
      {currency === 'RUB' ? `${num} ₽` : `$${num}`}
      {suffix && <span style={{ fontSize: 13, fontWeight: 700, opacity: .6 }}> {suffix}</span>}
    </span>
  );
}

/* ---------- confetti (burst) ---------- */
export function Confetti({ show }) {
  const pieces = useMemo(() => {
    const colors = ['#FFD000', '#FF2D8A', '#3B9BFF', '#3EE0B0', '#8B6CFF', '#FF8A1F', '#F3EEE4'];
    return Array.from({ length: 42 }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 0.5, dur: 1.5 + Math.random() * 1.3,
      color: colors[i % colors.length], size: 8 + Math.random() * 8,
    }));
  }, [show]);
  if (!show) return null;
  return (
    <div className="confetti" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 97 }}>
      {pieces.map((p, i) => (
        <i key={i} style={{
          position: 'absolute', top: '-18px', left: `${p.left}%`, width: p.size, height: p.size * 1.2,
          background: p.color, borderRadius: 3, animation: `fall ${p.dur}s linear ${p.delay}s forwards`,
        }} />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(700deg); opacity: .9; } }`}</style>
    </div>
  );
}

/* ---------- tap wiggle wrapper ---------- */
export function Tap({ children, onClick, className = '', ...rest }) {
  return (
    <div className={`press ${className}`} onClick={onClick} {...rest}>{children}</div>
  );
}
