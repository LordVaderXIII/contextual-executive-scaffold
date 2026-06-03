// ces-ui.jsx — shared primitives & icon set
const { useState: useStateUI, useEffect: useEffectUI } = React;

// ---------- icon set (simple stroke geometry) ----------
function Icon({ name, size = 22, stroke = 1.85, color = "currentColor", fill = "none" }) {
  const p = { fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    now: <><circle cx="12" cy="12" r="3.4" {...p} /><path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" {...p} /></>,
    tasks: <><path d="M9 6h11M9 12h11M9 18h11" {...p} /><path d="M4 6l1 1 1.8-2M4 12l1 1 1.8-2M4 18l1 1 1.8-2" {...p} /></>,
    timeline: <><rect x="3.5" y="4.5" width="17" height="16" rx="3" {...p} /><path d="M3.5 9h17M8 3v3M16 3v3M7.5 13h4M7.5 16.5h7" {...p} /></>,
    focus: <><circle cx="12" cy="13" r="7.2" {...p} /><path d="M12 13l3-3M9 2.5h6M12 5.8V2.5" {...p} /></>,
    more: <><circle cx="5" cy="12" r="1.6" fill={color} stroke="none" /><circle cx="12" cy="12" r="1.6" fill={color} stroke="none" /><circle cx="19" cy="12" r="1.6" fill={color} stroke="none" /></>,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    spark: <><path d="M12 3l1.7 5.1L19 9.8l-4.3 3.1L16 18l-4-3-4 3 1.3-5.1L5 9.8l5.3-1.7L12 3z" {...p} /></>,
    star: <path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.3L12 20.4 7.1 18.1l1.1-5.3-4-3.7 5.4-.6 2.4-5z" {...p} />,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevL: <path d="M15 5l-7 7 7 7" {...p} />,
    check: <path d="M5 12.5l4.2 4.2L19 7" {...p} />,
    play: <path d="M7 5.5l11 6.5-11 6.5z" fill={color} stroke="none" />,
    pause: <><rect x="7" y="6" width="3.4" height="12" rx="1.2" fill={color} stroke="none" /><rect x="13.6" y="6" width="3.4" height="12" rx="1.2" fill={color} stroke="none" /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" {...p} /><path d="M10 19a2 2 0 0 0 4 0" {...p} /></>,
    gear: <><circle cx="12" cy="12" r="3.1" {...p} /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} /></>,
    clock: <><circle cx="12" cy="12" r="8" {...p} /><path d="M12 7.5V12l3 2" {...p} /></>,
    flame: <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0 0 2 2 2 4a4 4 0 1 1-8 0c0-4 4-5 4-11z" {...p} />,
    home: <><path d="M4 11l8-6.5 8 6.5" {...p} /><path d="M6 9.5V20h12V9.5" {...p} /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7" {...p} /><path d="M3 20h18" {...p} /></>,
    pin: <><path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z" {...p} /><circle cx="12" cy="11" r="2.2" {...p} /></>,
    arrowR: <path d="M5 12h14M13 6l6 6-6 6" {...p} />,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    snooze: <><circle cx="12" cy="13" r="7.5" {...p} /><path d="M12 9v4l2.5 1.5" {...p} /><path d="M9 3h4l-4 4h4" {...p} /></>,
    pencil: <path d="M4 20l3.5-1L18 8.5 15.5 6 5 16.5 4 20z" {...p} />,
    leaf: <><path d="M4 20c0-9 7-15 16-15 0 9-7 15-16 15z" {...p} /><path d="M4 20c4-6 8-9 12-11" {...p} /></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>{paths[name]}</svg>;
}

function Btn({ children, variant = "primary", lg, full, icon, onClick, style }) {
  return (
    <button className={`btn btn--${variant}${lg ? " btn--lg" : ""}${full ? " btn--full" : ""}`} onClick={onClick} style={style}>
      {icon && <Icon name={icon} size={lg ? 21 : 19} />}
      {children}
    </button>);

}

function Chip({ children, active, onClick }) {
  return <button className="chip" data-active={!!active} onClick={onClick}>{children}</button>;
}

function Toggle({ on, onChange }) {
  return (
    <button className="toggle" data-on={!!on} onClick={() => onChange(!on)} aria-pressed={!!on}>
      <span className="toggle__knob" />
    </button>);

}

function ContextBadge({ ctx, onClick }) {
  return (
    <button className="ctxbadge" onClick={onClick} style={{ "--accent-h": ctx.hue }}>
      <span className="ctxbadge__dot" />
      {ctx.name}
      <Icon name="chevR" size={14} stroke={2.2} />
    </button>);

}

// circular progress ring (numbers/timer)
function Ring({ size = 232, stroke = 14, pct = 0, color = "var(--accent)", track = "var(--surface-2)", children }) {
  const r = (size - stroke) / 2,c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset .5s var(--ease)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>);

}

// bottom sheet
function Sheet({ title, onClose, children }) {
  useEffectUI(() => {
    const h = (e) => {if (e.key === "Escape") onClose();};
    window.addEventListener("keydown", h);return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        {title &&
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="sheet__title">{title}</div>
            <button className="iconbtn" onClick={onClose} style={{ width: 36, height: 36 }}><Icon name="x" size={19} /></button>
          </div>
        }
        {children}
      </div>
    </div>);

}

function ListRow({ icon, hue, title, detail, right, onClick, last }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left",
      background: "none", border: "none", cursor: onClick ? "pointer" : "default",
      padding: "14px 16px", borderBottom: last ? "none" : "1px solid var(--line-soft)", color: "var(--ink)"
    }}>
      {icon &&
      <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: hue != null ? `oklch(0.95 0.024 ${hue})` : "var(--accent-soft)",
        color: hue != null ? `oklch(0.45 0.06 ${hue})` : "var(--accent-ink)" }}>
          <Icon name={icon} size={19} />
        </span>
      }
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{title}</span>
        {detail && <span style={{ display: "block", fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--mono)", marginTop: 2 }}>{detail}</span>}
      </span>
      {right !== undefined ? right : onClick && <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />}
    </button>);

}

function fmtMMSS(sec) {
  const m = Math.floor(sec / 60),s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

Object.assign(window, {
  Icon, Btn, Chip, Toggle, ContextBadge, Ring, Sheet, ListRow, fmtMMSS
});